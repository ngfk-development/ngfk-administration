import { MoneybirdWebhookPayload } from '@app/types';
import { ApiExtensionContext } from '@directus/types';
import { Request, Response } from 'express';

import { ExtensionContext } from '../../types/extension-context';
import { loadMoneybirdContact } from './load-moneybird-contact';
import { loadMoneybirdContactPerson } from './load-moneybird-contact-person';

export async function moneybirdEndpoint(
  { accountability, body, schema }: Request,
  res: Response,
  apiCtx: ApiExtensionContext,
) {
  try {
    const ctx: ExtensionContext = { ...apiCtx, accountability, schema };
    const payload: MoneybirdWebhookPayload = body;
    const action = payload.action.endsWith('_destroyed') ? 'delete' : 'upsert';

    console.log(action);
    console.log(JSON.stringify(payload));

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
