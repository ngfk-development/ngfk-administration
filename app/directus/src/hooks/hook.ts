import { defineHook } from '@directus/extensions-sdk';

import { ExtensionContext } from '../types/extension-context';
import { mutateHarvestClients } from './harvest/mutate-harvest-client';
import { mutateHarvestContact } from './harvest/mutate-harvest-contact';

export default defineHook(async (hooks, hookCtx) => {
  const { action, filter } = hooks;
  const schema = await hookCtx.getSchema();
  const ctx: ExtensionContext = { ...hookCtx, schema };

  function registerMutateFunction(
    collection: string,
    fn: (
      ctx: ExtensionContext,
      keys: string[],
      action: 'delete' | 'upsert',
    ) => Promise<void>,
  ) {
    action(`${collection}.items.create`, (meta) => {
      fn(ctx, [meta.key], 'upsert');
    });

    action(`${collection}.items.update`, (meta) => {
      fn(ctx, meta.keys, 'upsert');
    });

    filter(`${collection}.items.delete`, async (keys: any) => {
      await fn(ctx, keys, 'delete');
    });
  }

  registerMutateFunction('app_customer', mutateHarvestClients);
  registerMutateFunction('app_contact', mutateHarvestContact);

  filter('users.create', async (input: any) => {
    const email = process.env.ADMIN_EMAIL;
    const token = process.env.ADMIN_API_KEY;
    if (!email || !token) return input;
    return input.email === email ? { ...input, token } : input;
  });
});
