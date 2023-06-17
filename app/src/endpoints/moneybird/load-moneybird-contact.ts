import { randomUUID } from 'node:crypto';

import { ItemsService } from '@directus/api';

import { moneybird } from '../../clients/moneybird';
import { Customer } from '../../types/directus/customer';
import { ExtensionContext } from '../../types/directus/extension-context';
import { MoneybirdContact } from '../../types/moneybird/moneybird-contact';
import { camelToSnakeCase } from '../../utils/change-casing';
import { loadMoneybirdContactPerson } from './load-moneybird-contact-person';

export async function loadMoneybirdContact(
  ctx: ExtensionContext,
  entity: MoneybirdContact,
  action: 'delete' | 'upsert',
) {
  const { ItemsService } = ctx.services;
  const service: ItemsService = new ItemsService('app_customer', ctx);

  const directusField = moneybird.directusField(entity);
  const harvestField = moneybird.harvestField(entity);

  const id = directusField?.value || randomUUID();
  if (!directusField?.value) {
    await moneybird.patch(`/contacts/${entity.id}.json`, {
      contact: {
        custom_fields_attributes: [
          { id: process.env.MONEYBIRD_FIELD_DIRECTUS, value: id },
        ],
      },
    });
  }

  if (action === 'delete') await service.deleteOne(id);
  else if (action === 'upsert') {
    const customer: Customer = {
      id,
      idHarvest: harvestField?.value ?? undefined,
      idMoneybird: entity.id,

      name: entity.company_name,
      street: entity.address1,
      postalCode: entity.zipcode,
      city: entity.city,
      kvkNumber: entity.chamber_of_commerce,
      vatNumber: entity.tax_number,
    };

    await service.upsertOne(camelToSnakeCase(customer));

    for (const contactPerson of entity.contact_people)
      await loadMoneybirdContactPerson(ctx, contactPerson, action, customer);
  }
}
