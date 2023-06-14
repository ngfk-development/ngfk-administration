import { randomUUID } from 'node:crypto';

import { Customer, MoneybirdContact } from '@app/types';
import { ItemsService } from '@directus/api';

import { moneybird } from '../../clients/moneybird';
import { HookContext } from '../../types/hook-context';
import { camelToSnakeCase } from '../../utils/change-casing';

export async function loadMoneybirdContact(
  ctx: HookContext,
  entity: MoneybirdContact,
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
}
