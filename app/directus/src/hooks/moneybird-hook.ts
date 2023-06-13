import { randomUUID } from 'node:crypto';

import {
  Customer,
  MoneybirdCustomField,
  MoneybirdWebhookPayload,
} from '@app/types';
import { ApiExtensionContext } from '@directus/types';
import { Request, Response } from 'express';

import { upsertItem } from '../utils/upsert-item';

export async function moneybirdHook(
  req: Request,
  res: Response,
  { services }: ApiExtensionContext,
) {
  try {
    const payload = req.body as MoneybirdWebhookPayload;

    switch (payload.entity_type) {
      case 'Contact':
        await upsertItem<Customer>(services, req, 'app_customer', {
          id:
            readCustomField(payload.entity.custom_fields, 'Directus ID') ??
            randomUUID(),
          idHarvest:
            readCustomField(payload.entity.custom_fields, 'Harvest ID') ??
            undefined,
          idMoneybird: payload.entity.id,

          name: payload.entity.company_name,
          street: payload.entity.address1,
          postalCode: payload.entity.zipcode,
          city: payload.entity.city,
          kvkNumber: payload.entity.chamber_of_commerce,
          vatNumber: payload.entity.zipcode,
        });

        break;
      case 'ContactPerson':
        break;
    }

    res.status(200).end();
  } catch {
    res.status(500).end();
  }
}

function readCustomField(customFields: MoneybirdCustomField[], name: string) {
  return customFields.find((field) => field.name === name)?.value;
}
