import { PrismaClient } from '@prisma/client';
import fastifyPlugin from 'fastify-plugin';

import { withMoneybird } from '~/database/database-moneybird';
import { withPubSub } from '~/database/database-pub-sub';

const database = new PrismaClient()
  .$extends(withPubSub())
  .$extends(withMoneybird());

declare module 'fastify' {
  interface FastifyInstance {
    database: typeof database;
  }
}

export default fastifyPlugin(async (app) => {
  app.decorate('database', database);
});
