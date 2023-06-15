import { randomUUID } from 'node:crypto';

import {
  Contact,
  Customer,
  MoneybirdContact,
  MoneybirdContactPerson,
} from '@app/types';
import { ItemsService } from '@directus/api';

import { moneybird } from '../../clients/moneybird';
import { ExtensionContext } from '../../types/extension-context';
import { camelToSnakeCase, snakeToCamelCase } from '../../utils/change-casing';

export async function loadMoneybirdContactPerson(
  ctx: ExtensionContext,
  entity: MoneybirdContactPerson,
  action: 'delete' | 'upsert',
  customer?: Customer,
) {
  customer ??= await findCustomer(ctx, entity.contact_id);
  if (!customer) return;

  const { ItemsService } = ctx.services;
  const service: ItemsService = new ItemsService('app_contact', ctx);

  const [existing] = await service.readByQuery({
    filter: { id_moneybird: { _eq: entity.contact_id } },
    limit: 1,
  });

  if (action === 'delete') await service.deleteOne(existing.id);
  else if (action === 'upsert') {
    const contact: Partial<Contact> = {
      id: existing?.id ?? randomUUID(),
      idMoneybird: entity.contact_id,

      firstName: entity.firstname,
      lastName: entity.lastname,
      phone: entity.phone,
      email: entity.email,
      customer: customer.id,
    };

    await service.upsertOne(camelToSnakeCase(contact));
  }
}

async function findCustomer(ctx: ExtensionContext, id: string) {
  const { ItemsService } = ctx.services;
  const service: ItemsService = new ItemsService('app_customer', ctx);

  const moneybirdContact = await fetchMoneybirdContact(id);
  const directusField = moneybird.directusField(moneybirdContact);
  if (!directusField) return undefined;

  const item = await service.readOne(directusField.value);
  return snakeToCamelCase(item) as Customer;
}

async function fetchMoneybirdContact(id: string) {
  const res = await moneybird.get(`/contacts/${id}.json`);
  return res.data as MoneybirdContact;
}
