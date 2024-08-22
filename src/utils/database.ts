import { PrismaClient } from '@prisma/client';
import fastifyPlugin from 'fastify-plugin';

import { withPubSub } from '~/utils/database-pub-sub';

const database = new PrismaClient().$extends(withPubSub());

declare module 'fastify' {
  interface FastifyInstance {
    database: typeof database;
  }
}

export default fastifyPlugin(async (app) => {
  app.decorate('database', database);
});
