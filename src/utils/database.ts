import { PrismaClient } from '@prisma/client';
import fastifyPlugin from 'fastify-plugin';

import { withMoneybird } from '~/utils/database-moneybird';
import { withPubSub } from '~/utils/database-pub-sub';

const extension = withMoneybird();

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
