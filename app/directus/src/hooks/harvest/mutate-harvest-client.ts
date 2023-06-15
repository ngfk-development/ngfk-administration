import { Customer, HarvestClient } from '@app/types';
import type { ItemsService } from '@directus/api';

import { harvest } from '../../clients/harvest';
import { ExtensionContext } from '../../types/extension-context';
import { camelToSnakeCase, snakeToCamelCase } from '../../utils/change-casing';

export async function mutateHarvestClients(
  ctx: ExtensionContext,
  keys: string[],
  action: 'delete' | 'upsert',
) {
  const { ItemsService } = ctx.services;
  const service: ItemsService = new ItemsService('app_customer', ctx);

  const items = await service.readMany(keys);
  const customers = items.map((item) => snakeToCamelCase(item) as Customer);

  for (const customer of customers) {
    if (action === 'delete') await deleteHarvestClient(customer);
    else if (action === 'upsert') {
      if (!customer.idHarvest) await createHarvestClient(service, customer);
      else await updateHarvestClient(customer);
    }
  }
}

async function deleteHarvestClient(customer: Customer) {
  if (customer.idHarvest)
    await harvest.delete(`/clients/${customer.idHarvest}`);
}

async function createHarvestClient(service: ItemsService, customer: Customer) {
  const res = await harvest.post(
    '/clients',
    {},
    { params: parseClient(customer) },
  );

  const { id } = res.data as { id: number };
  await service.updateOne(
    customer.id,
    camelToSnakeCase({ idHarvest: id.toString() }),
  );
}

async function updateHarvestClient(customer: Customer) {
  await harvest.patch(
    `/clients/${customer.idHarvest}`,
    {},
    { params: parseClient(customer) },
  );
}

function parseClient(customer: Customer) {
  const client: Omit<HarvestClient, 'harvest_id'> = {
    name: customer.name,
    is_active: true,
    address: `${customer.street}\n${customer.postalCode} ${customer.city}`,
    currency: 'EUR',
  };

  return client;
}
