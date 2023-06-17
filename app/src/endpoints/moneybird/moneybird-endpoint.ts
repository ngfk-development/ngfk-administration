import { ApiExtensionContext } from '@directus/types';
import { Request, Response } from 'express';

import { ExtensionContext } from '../../types/directus/extension-context';
import { MoneybirdWebhookPayload } from '../../types/moneybird/moneybird-webhook-payload';
import { loadMoneybirdContactPerson } from './load-moneybird-contact-person';
import { loadMoneybirdContact } from './load-moneybird-contact';

export async function moneybirdEndpoint(
  { accountability, body, schema }: Request,
  res: Response,
  apiCtx: ApiExtensionContext,
) {
  try {
    const ctx: ExtensionContext = { ...apiCtx, accountability, schema };
    const payload: MoneybirdWebhookPayload = body;
    const action = payload.action.endsWith('_destroyed') ? 'delete' : 'upsert';

    switch (payload.entity_type) {
      case 'Contact':
        await loadMoneybirdContact(ctx, payload.entity, action);
        break;
      case 'ContactPerson':
        await loadMoneybirdContactPerson(ctx, payload.entity, action);
        break;
    }

    res.status(200).end();
  } catch (e) {
    console.log(JSON.stringify(e));
    res.status(500).end();
  }
}
