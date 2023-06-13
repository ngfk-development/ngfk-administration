import { defineEndpoint } from '@directus/extensions-sdk';

import { moneybirdHook } from './hooks/moneybird-hook';

export default defineEndpoint({
  id: 'hook',
  handler: (router) => {
    router.post('/moneybird', moneybirdHook);
  },
});
