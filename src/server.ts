import Fastify from 'fastify';

import moneybirdWebhook from '~/controllers/moneybird-webhook';
import database from '~/utils/database';
import services from '~/utils/services';

const PORT = process.env.PORT || '4000';

const app = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        messageFormat: '{if rid}[{rid}] {end}{msg}',
        ignore: [
          'hostname',
          'pid',
          'req',
          'reqId',
          'res',
          'responseTime',
          'rid',
        ].join(','),
      },
    },
  },
});

app
  .register(database)
  .register(services, {
    moneybird: {
      endpoint: process.env.MONEYBIRD_ENDPOINT,
      token: process.env.MONEYBIRD_TOKEN,
    },
  })
  .register(moneybirdWebhook)
  .get('/live', async () => ({ success: true }))
  .listen({ host: '0.0.0.0', port: parseInt(PORT, 10) });
