import Fastify from 'fastify';
import fastifyCron from 'fastify-cron';

import harvestTimer from '~/controllers/api/harvest-timer';
import moneybirdWebhook from '~/controllers/moneybird-webhook';
import database from '~/database/database';
import services from '~/services/services';

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
  .register(fastifyCron)
  .register(database)
  .register(services, {
    harvest: {
      accountId: process.env.HARVEST_ACCOUNT_ID,
      endpoint: process.env.HARVEST_ENDPOINT,
      token: process.env.HARVEST_TOKEN,
    },
    jira: {
      endpoint: process.env.JIRA_ENDPOINT,
      token: process.env.JIRA_TOKEN,
      username: process.env.JIRA_USERNAME,
      leadAccountId: process.env.JIRA_LEAD_ACCOUNT_ID,
    },
    moneybird: {
      endpoint: process.env.MONEYBIRD_ENDPOINT,
      token: process.env.MONEYBIRD_TOKEN,
      webhookToken: process.env.MONEYBIRD_WEBHOOK_TOKEN,
    },
  })
  .register(harvestTimer)
  .register(moneybirdWebhook)
  .get('/live', async () => ({ success: true }))
  .listen({ host: '0.0.0.0', port: parseInt(PORT, 10) });
