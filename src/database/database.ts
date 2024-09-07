import { PrismaClient } from '@prisma/client';
import fastifyPlugin from 'fastify-plugin';

import { withHarvest } from '~/database/plugins/with-harvest';
import { withJira } from '~/database/plugins/with-jira';
import { withMoneybird } from '~/database/plugins/with-moneybird';
import { withPubSub } from '~/database/plugins/with-pub-sub';

const database = new PrismaClient()
  .$extends(withPubSub())
  .$extends(withHarvest())
  .$extends(withJira())
  .$extends(withMoneybird());

declare module 'fastify' {
  interface FastifyInstance {
    database: typeof database;
  }
}

export default fastifyPlugin(async (app) => {
  await database.$connect();

  app.decorate('database', database);

  app.addHook('onClose', async () => {
    await database.$disconnect();
  });
});
