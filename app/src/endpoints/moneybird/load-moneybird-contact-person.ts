import { randomUUID } from 'node:crypto';

import { ItemsService } from '@directus/api';

import { moneybird } from '../../clients/moneybird';
import { Contact } from '../../types/directus/contact';
import { Customer } from '../../types/directus/customer';
import { ExtensionContext } from '../../types/directus/extension-context';
import { MoneybirdContactPerson } from '../../types/moneybird/moneybird-contact-person';
import { MoneybirdContact } from '../../types/moneybird/moneybird-contact';

export async function loadMoneybirdContactPerson(
  ctx: ExtensionContext,
  entity: MoneybirdContactPerson,
  action: 'delete' | 'upsert',
  customer?: Customer,
) {
  customer ??= await findCustomer(ctx, entity.contact_id);
  if (!customer) return;

  const { ItemsService } = ctx.services;
  const service: ItemsService<Contact> = new ItemsService('app_contact', ctx);

  const [existing] = await service.readByQuery({
    filter: { id_moneybird: { _eq: entity.contact_id } },
    limit: 1,
  });

  if (action === 'delete') await service.deleteOne(existing.id);
  else if (action === 'upsert') {
    await service.upsertOne({
      id: existing?.id ?? randomUUID(),
      id_moneybird: entity.contact_id,

      first_name: entity.firstname,
      last_name: entity.lastname,
      title: entity.department,
      phone: entity.phone,
      email: entity.email,
      customer: customer.id,
    });
  }
}

async function findCustomer(ctx: ExtensionContext, id: string) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Customer> = new ItemsService('app_customer', ctx);

  const moneybirdContact = await fetchMoneybirdContact(id);
  const directusField = moneybird.directusField(moneybirdContact);
  if (!directusField) return undefined;

  return service.readOne(directusField.value);
}

async function fetchMoneybirdContact(id: string) {
  const res = await moneybird.get(`/contacts/${id}.json`);
  return res.data as MoneybirdContact;
}
