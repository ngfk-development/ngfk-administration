import { defineEndpoint } from '@directus/extensions-sdk';

import { moneybirdEndpoint } from './endpoints/moneybird/moneybird-endpoint';

export default defineEndpoint({
  id: 'hook',
  handler: (router, ctx) => {
    router.post('/moneybird', (req, res) => moneybirdEndpoint(req, res, ctx));
  },
});
