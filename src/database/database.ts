import { PrismaClient } from '@prisma/client';
import fastifyPlugin from 'fastify-plugin';

import { withHarvest } from '~/database/database-harvest';
import { withMoneybird } from '~/database/database-moneybird';
import { withPubSub } from '~/database/database-pub-sub';

const database = new PrismaClient()
  .$extends(withPubSub())
  .$extends(withHarvest())
  .$extends(withMoneybird());

declare module 'fastify' {
  interface FastifyInstance {
    database: typeof database;
  }
}

export default fastifyPlugin(async (app) => {
  app.decorate('database', database);
});
