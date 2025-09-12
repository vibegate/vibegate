import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { z } from "zod";

const idParamSchema = z.object({
  id: z.string(),
});

export default async function exampleRouter(fastify: FastifyInstance) {
  fastify
    .withTypeProvider<ZodTypeProvider>()
    .get<{
      Params: z.infer<typeof idParamSchema>;
    }>("/test/:id", {
      schema: {
        params: idParamSchema,
      }
    }, async (request, reply) => {
      return reply.send({ message: "Hello World" });
    });
}
