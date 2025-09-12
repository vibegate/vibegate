import { FastifyReply, FastifyRequest } from 'fastify'
import { API_SECRET } from '../utils/constants.js'

export async function validateApiSecret(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization

  if (!authHeader) {
    return reply.status(401).send({ error: 'Missing Authorization header' })
  }

  const token = authHeader.replace('Bearer ', '')
  
  if (!API_SECRET || token !== API_SECRET) {
    return reply.status(401).send({ error: 'Invalid API secret' })
  }
}
