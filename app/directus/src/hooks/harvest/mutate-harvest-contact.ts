import { Contact, Customer, HarvestContact } from '@app/types';
import type { ItemsService } from '@directus/api';

import { harvest } from '../../clients/harvest';
import { ExtensionContext } from '../../types/extension-context';
import { camelToSnakeCase, snakeToCamelCase } from '../../utils/change-casing';

export async function mutateHarvestContact(
  ctx: ExtensionContext,
  keys: string[],
  action: 'delete' | 'upsert',
) {
  const { ItemsService } = ctx.services;
  const service: ItemsService = new ItemsService('app_contact', ctx);

  const items = await service.readMany(keys);
  const contacts = items.map((item) => snakeToCamelCase(item) as Contact);
  const customers = await fetchCustomers(ctx, contacts);

  for (const contact of contacts) {
    if (action === 'delete') await deleteHarvestContact(contact);
    else if (action === 'upsert') {
      if (!contact.idHarvest) {
        const customer = customers.find((c) => c.id === contact.customer);
        if (customer) await createHarvestContact(service, customer, contact);
      } else await updateHarvestContact(contact);
    }
  }
}

async function deleteHarvestContact(contact: Contact) {
  if (contact.idHarvest) await harvest.delete(`/contacts/${contact.idHarvest}`);
}

async function createHarvestContact(
  service: ItemsService,
  customer: Customer,
  contact: Contact,
) {
  const res = await harvest.post(
    '/contacts',
    {},
    { params: parseContact(customer, contact) },
  );

  const { id } = res.data as { id: number };
  await service.updateOne(
    contact.id,
    camelToSnakeCase({ idHarvest: id.toString() }),
  );
}

async function updateHarvestContact(contact: Contact) {
  await harvest.patch(
    `/contacts/${contact.idHarvest}`,
    {},
    { params: parseContact(null, contact) },
  );
}

async function fetchCustomers(ctx: ExtensionContext, contacts: Contact[]) {
  const keys = contacts
    .filter((contact) => !contact.idHarvest)
    .map((contact) => contact.customer!)
    .filter(Boolean);
  if (!keys.length) return [];

  const { ItemsService } = ctx.services;
  const service: ItemsService = new ItemsService('app_customer', ctx);

  const items = await service.readMany(keys);
  return items.map((item) => snakeToCamelCase(item) as Customer);
}

function parseContact(customer: Customer | null, contact: Contact) {
  const harvestContact: Partial<HarvestContact> = {
    ...(customer?.idHarvest ? { client_id: +customer.idHarvest } : {}),
    email: contact.email ?? '',
    first_name: contact.firstName,
    last_name: contact.lastName,
    phone_mobile: contact.phone ?? '',
    title: contact.title,
  };

  return harvestContact;
}
