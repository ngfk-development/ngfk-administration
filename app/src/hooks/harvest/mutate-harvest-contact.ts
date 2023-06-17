import type { ItemsService } from '@directus/api';

import { harvest } from '../../clients/harvest';
import { Contact } from '../../types/directus/contact';
import { Customer } from '../../types/directus/customer';
import { ExtensionContext } from '../../types/directus/extension-context';
import { HarvestContact } from '../../types/harvest/harvest-contact';

export async function mutateHarvestContact(
  ctx: ExtensionContext,
  keys: string[],
  action: 'delete' | 'upsert',
) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Contact> = new ItemsService('app_contact', ctx);

  const contacts = await service.readMany(keys);
  const customers = await fetchCustomers(ctx, contacts);

  for (const contact of contacts) {
    if (action === 'delete') await deleteHarvestContact(contact);
    else if (action === 'upsert') {
      if (!contact.id_harvest) {
        const customer = customers.find((c) => c.id === contact.customer);
        if (customer) await createHarvestContact(service, customer, contact);
      } else await updateHarvestContact(contact);
    }
  }
}

async function deleteHarvestContact(contact: Contact) {
  if (contact.id_harvest)
    await harvest.delete(`/contacts/${contact.id_harvest}`);
}

async function createHarvestContact(
  service: ItemsService<Contact>,
  customer: Customer,
  contact: Contact,
) {
  const res = await harvest.post(
    '/contacts',
    {},
    { params: parseContact(customer, contact) },
  );

  const { id } = res.data as { id: number };
  await service.updateOne(contact.id, { id_harvest: id.toString() });
}

async function updateHarvestContact(contact: Contact) {
  await harvest.patch(
    `/contacts/${contact.id_harvest}`,
    {},
    { params: parseContact(null, contact) },
  );
}

function fetchCustomers(ctx: ExtensionContext, contacts: Contact[]) {
  const keys = contacts
    .filter((contact) => !contact.id_harvest)
    .map((contact) => contact.customer!)
    .filter(Boolean);
  if (!keys.length) return [];

  const { ItemsService } = ctx.services;
  const service: ItemsService<Customer> = new ItemsService('app_customer', ctx);

  return service.readMany(keys);
}

function parseContact(customer: Customer | null, contact: Contact) {
  const harvestContact: Partial<HarvestContact> = {
    ...(customer?.id_harvest ? { client_id: +customer.id_harvest } : {}),
    email: contact.email ?? '',
    first_name: contact.first_name,
    last_name: contact.last_name,
    phone_mobile: contact.phone ?? '',
    title: contact.title,
  };

  return harvestContact;
}
