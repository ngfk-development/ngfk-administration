import { PrismaClient } from '@prisma/client';
import fastifyPlugin from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    database: PrismaClient;
  }
}

export default fastifyPlugin(async (app) => {
  app.decorate('database', new PrismaClient());
});
