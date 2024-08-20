import Fastify from 'fastify';

import database from '~/utils/database';

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
  .get('/live', async () => {
    type QueryResponse = { version: number }[];
    const resp = await app.database.$queryRaw<QueryResponse>`SELECT version()`;
    const database = resp[0].version;

    return { success: true, database };
  })
  .listen({ host: '0.0.0.0', port: parseInt(PORT, 10) });
