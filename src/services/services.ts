import fastifyPlugin from 'fastify-plugin';

import { HarvestService } from '~/services/harvest-service';
import { JiraService } from '~/services/jira-service';
import { MoneybirdService } from '~/services/moneybird-service';

interface ServiceMap {
  harvest: typeof HarvestService;
  jira: typeof JiraService;
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
  const jira = new JiraService({ ...options.jira, database });
  const moneybird = new MoneybirdService({ ...options.moneybird, database });

  app.decorate('harvest', harvest);
  app.decorate('jira', jira);
  app.decorate('moneybird', moneybird);

  async function synchronize() {
    await moneybird.synchronize();
    await harvest.synchronize();
    await jira.synchronize();
  }

  async function initializeSubscriptions() {
    moneybird.initializeSubscriptions();
    jira.initializeSubscriptions();
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
