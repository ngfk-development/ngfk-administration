import { defineHook } from '@directus/extensions-sdk';

import { ExtensionContext } from '../types/directus/extension-context';
import { commandData } from './command-data/command-data';
import { mutateHarvestClients } from './harvest/mutate-harvest-client';
import { mutateHarvestContact } from './harvest/mutate-harvest-contact';
import { mutateHarvestProject } from './harvest/mutate-harvest-project';
import { mutateHarvestTask } from './harvest/mutate-harvest-task';
import { mutateMoneybirdProject } from './moneybird/mutate-moneybird-project';

export default defineHook((hooks, hookCtx) => {
  const { action, filter, init } = hooks;

  async function registerMutateFunction(
    collection: string,
    fn: (
      ctx: ExtensionContext,
      keys: string[],
      action: 'delete' | 'upsert',
    ) => Promise<void>,
  ) {
    action(`${collection}.items.create`, (meta, eventCtx) => {
      const ctx: ExtensionContext = { ...hookCtx, ...eventCtx };
      fn(ctx, [meta.key], 'upsert');
    });
    action(`${collection}.items.update`, (meta, eventCtx) => {
      const ctx: ExtensionContext = { ...hookCtx, ...eventCtx };
      fn(ctx, meta.keys, 'upsert');
    });
    filter(`${collection}.items.delete`, async (keys: any, {}, eventCtx) => {
      const ctx: ExtensionContext = { ...hookCtx, ...eventCtx };
      await fn(ctx, keys, 'delete');
    });
  }

  init('cli.after', async ({ program }) => {
    const ctx: ExtensionContext = {
      ...hookCtx,
      accountability: null,
      schema: await hookCtx.getSchema(),
    };

    commandData(ctx, program);
  });

  filter('users.create', async (input: any) => {
    const email = process.env.ADMIN_EMAIL;
    const token = process.env.ADMIN_API_KEY;
    if (!email || !token) return input;
    return input.email === email ? { ...input, token } : input;
  });

  registerMutateFunction('app_customer', mutateHarvestClients);
  registerMutateFunction('app_contact', mutateHarvestContact);
  registerMutateFunction('app_project', mutateHarvestProject);
  registerMutateFunction('app_epic', mutateHarvestTask);

  registerMutateFunction('app_project', mutateMoneybirdProject);
});
