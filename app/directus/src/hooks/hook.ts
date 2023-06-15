import { defineHook } from '@directus/extensions-sdk';

import { mutateHarvestClients } from './harvest/mutate-harvest-client';
import { ExtensionContext } from '../types/extension-context';

export default defineHook(async (hooks, hookCtx) => {
  const ctx: ExtensionContext = {
    ...hookCtx,
    schema: await hookCtx.getSchema(),
  };

  const { action, filter } = hooks;

  action('app_customer.items.create', (meta) => {
    mutateHarvestClients(ctx, [meta.key], 'upsert');
  });

  action('app_customer.items.update', (meta) => {
    mutateHarvestClients(ctx, meta.keys, 'upsert');
  });

  filter('app_customer.items.delete', async (keys: any) => {
    await mutateHarvestClients(ctx, keys, 'delete');
  });

  filter('users.create', async (input: any) => {
    const email = process.env.ADMIN_EMAIL;
    const token = process.env.ADMIN_API_KEY;
    if (!email || !token) return input;
    return input.email === email ? { ...input, token } : input;
  });
});
