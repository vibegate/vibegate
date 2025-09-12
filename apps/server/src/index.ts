import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import exampleRouter from './routers/example.js'
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'

const fastify = Fastify({
  logger: true
})

// Register plugins
fastify.register(cors, {
  origin: true
})

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Swagger documentation setup
fastify.register(swagger, {
  swagger: {
    info: {
      title: 'Weightwave API',
      description: 'API documentation for Weightwave',
      version: '1.0.0'
    },
    // host: 'localhost:3000',
    // schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  },

  transform: jsonSchemaTransform,
})

fastify.register(swaggerUi, {
  routePrefix: '/docs'
})

const fastifyWithTypeProvider = fastify.withTypeProvider<ZodTypeProvider>()

fastifyWithTypeProvider.register(exampleRouter, { prefix: '/api/example' }) 

fastifyWithTypeProvider.get('/', async (request, reply) => {
  return { title: 'Weightwave API' }
})

fastifyWithTypeProvider.get('/health', async (request, reply) => {
  return { status: 'ok' }
})

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT || 3000), host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
