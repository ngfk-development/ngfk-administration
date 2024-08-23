import fastifyPlugin from 'fastify-plugin';

import { HarvestService } from '~/services/harvest-service';
import { MoneybirdService } from '~/services/moneybird-service';

interface ServiceMap {
  harvest: typeof HarvestService;
  moneybird: typeof MoneybirdService;
}

type Services = {
  [K in keyof ServiceMap]: InstanceType<ServiceMap[K]>;
};

type Options = {
  [K in keyof ServiceMap]: Omit<
    ConstructorParameters<ServiceMap[K]>[0],
    'database'
  >;
};

declare module 'fastify' {
  interface FastifyInstance extends Services {}
}

export default fastifyPlugin<Options>(async (app, options) => {
  const { database } = app;

  const harvest = new HarvestService({ ...options.harvest, database });
  const moneybird = new MoneybirdService({ ...options.moneybird, database });

  app.decorate('harvest', harvest);
  app.decorate('moneybird', moneybird);

  async function synchronize() {
    await moneybird.synchronize();
    await harvest.synchronize();
  }

  async function initializeSubscriptions() {
    harvest.initializeSubscriptions();
  }

  await synchronize();
  initializeSubscriptions();

  app.cron.createJob({
    cronTime: '* * * * *',
    onTick: () => synchronize(),
    start: true,
  });
});
