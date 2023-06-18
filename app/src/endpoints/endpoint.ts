import { defineEndpoint } from '@directus/extensions-sdk';

import { jiraEndpoint } from './jira/jira-endpoint';
import { moneybirdEndpoint } from './moneybird/moneybird-endpoint';

export default defineEndpoint({
  id: 'hook',
  handler: (router, ctx) => {
    router.post('/jira', (req, res) => jiraEndpoint(req, res, ctx));
    router.post('/moneybird', (req, res) => moneybirdEndpoint(req, res, ctx));
  },
});
