import { randomUUID } from 'node:crypto';

import { ItemsService } from '@directus/api';

import { moneybird } from '../../clients/moneybird';
import { Customer } from '../../types/directus/customer';
import { ExtensionContext } from '../../types/directus/extension-context';
import { MoneybirdContact } from '../../types/moneybird/moneybird-contact';
import { loadMoneybirdContactPerson } from './load-moneybird-contact-person';

export async function loadMoneybirdContact(
  ctx: ExtensionContext,
  entity: MoneybirdContact,
  action: 'delete' | 'upsert',
) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Customer> = new ItemsService('app_customer', ctx);

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
      id_harvest: harvestField?.value ?? undefined,
      id_moneybird: entity.id,

      name: entity.company_name,
      street: entity.address1,
      postal_code: entity.zipcode,
      city: entity.city,
      kvk_number: entity.chamber_of_commerce,
      vat_number: entity.tax_number,
    };

    await service.upsertOne(customer);

    for (const contactPerson of entity.contact_people)
      await loadMoneybirdContactPerson(ctx, contactPerson, action, customer);
  }
}
