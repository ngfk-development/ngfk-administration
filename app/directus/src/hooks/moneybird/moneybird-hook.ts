import { MoneybirdWebhookPayload } from '@app/types';
import { ApiExtensionContext } from '@directus/types';
import { Request, Response } from 'express';

import { HookContext } from '../../types/hook-context';
import { loadMoneybirdContact } from './load-moneybird-contact';
import { loadMoneybirdContactPerson } from './load-moneybird-contact-person';

export async function moneybirdHook(
  { accountability, body, schema }: Request,
  res: Response,
  apiCtx: ApiExtensionContext,
) {
  try {
    const ctx: HookContext = { ...apiCtx, accountability, schema };
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
    res.status(500).end();
  }
}
