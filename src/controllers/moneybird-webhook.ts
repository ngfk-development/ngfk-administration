import fastifyPlugin from 'fastify-plugin';

import { MoneybirdEvent } from '~/types/moneybird/moneybird-event';

export default fastifyPlugin(async (app, options) => {
  app.post('/hook/moneybird', options, async (req, reply) => {
    try {
      const event = req.body as MoneybirdEvent;
      await app.moneybird.handleEvent(event);

      return reply.status(200);
    } catch {
      return reply.status(500);
    }
  });
});
