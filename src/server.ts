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
    harvest: {
      accountId: process.env.HARVEST_ACCOUNT_ID,
      endpoint: process.env.HARVEST_ENDPOINT,
      token: process.env.HARVEST_TOKEN,
    },
    moneybird: {
      endpoint: process.env.MONEYBIRD_ENDPOINT,
      token: process.env.MONEYBIRD_TOKEN,
      webhookToken: process.env.MONEYBIRD_WEBHOOK_TOKEN,
    },
  })
  .register(moneybirdWebhook)
  .get('/live', async () => ({ success: true }))
  .listen({ host: '0.0.0.0', port: parseInt(PORT, 10) });
