import type { ItemsService } from '@directus/api';

import { harvest } from '../../clients/harvest';
import { Customer } from '../../types/directus/customer';
import { ExtensionContext } from '../../types/directus/extension-context';
import { HarvestClient } from '../../types/harvest/harvest-client';

export async function mutateHarvestClients(
  ctx: ExtensionContext,
  keys: string[],
  action: 'delete' | 'upsert',
) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Customer> = new ItemsService('app_customer', ctx);

  const customers = await service.readMany(keys);

  for (const customer of customers) {
    if (action === 'delete') await deleteHarvestClient(customer);
    else if (action === 'upsert') {
      if (!customer.id_harvest) await createHarvestClient(service, customer);
      else await updateHarvestClient(customer);
    }
  }
}

async function deleteHarvestClient(customer: Customer) {
  if (customer.id_harvest)
    await harvest.delete(`/clients/${customer.id_harvest}`);
}

async function createHarvestClient(
  service: ItemsService<Customer>,
  customer: Customer,
) {
  const res = await harvest.post(
    '/clients',
    {},
    { params: parseClient(customer) },
  );

  const { id } = res.data as { id: number };
  await service.updateOne(customer.id, { id_harvest: id.toString() });
}

async function updateHarvestClient(customer: Customer) {
  await harvest.patch(
    `/clients/${customer.id_harvest}`,
    {},
    { params: parseClient(customer) },
  );
}

function parseClient(customer: Customer) {
  const client: HarvestClient = {
    name: customer.name,
    is_active: true,
    address: `${customer.street}\n${customer.postal_code} ${customer.city}`,
    currency: 'EUR',
  };

  return client;
}
