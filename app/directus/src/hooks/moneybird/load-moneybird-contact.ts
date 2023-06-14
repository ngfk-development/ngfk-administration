import { randomUUID } from 'node:crypto';

import { Customer, MoneybirdContact } from '@app/types';

import { moneybird } from '../../clients/moneybird';
import { HookContext } from '../../types/hook-context';
import { upsertItem } from '../../utils/upsert-item';

export async function loadMoneybirdContact(
  ctx: HookContext,
  entity: MoneybirdContact,
) {
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

  await upsertItem<Customer>(ctx, 'customer', {
    id,
    idHarvest: harvestField?.value ?? undefined,
    idMoneybird: entity.id,

    name: entity.company_name,
    street: entity.address1,
    postalCode: entity.zipcode,
    city: entity.city,
    kvkNumber: entity.chamber_of_commerce,
    vatNumber: entity.tax_number,
  });
}
