import { defineEndpoint } from '@directus/extensions-sdk';

export default defineEndpoint({
  id: 'hook',
  handler: (router) => {
    router.get('/', (_req, res) => res.send('Hello World!'));
  },
});
