import { defineEndpoint } from '@directus/extensions-sdk';

import { moneybirdHook } from './hooks/moneybird/moneybird-hook';

export default defineEndpoint({
  id: 'hook',
  handler: (router, ctx) => {
    router.post('/moneybird', (req, res) => moneybirdHook(req, res, ctx));
  },
});
