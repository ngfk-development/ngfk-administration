import Fastify from 'fastify';

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
  .get('/live', () => ({ success: true }))
  .listen({ host: '0.0.0.0', port: parseInt(PORT, 10) });
