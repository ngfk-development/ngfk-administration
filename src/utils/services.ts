import fastifyPlugin from 'fastify-plugin';

import { MoneybirdService } from '~/services/moneybird-service';

interface ServiceMap {
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

  const moneybird = new MoneybirdService({ ...options.moneybird, database });
  await moneybird.synchronize();

  app.decorate('moneybird', moneybird);
});
