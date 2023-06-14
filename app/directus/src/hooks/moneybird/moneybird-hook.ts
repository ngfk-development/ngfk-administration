import { MoneybirdWebhookPayload } from '@app/types';
import { ApiExtensionContext } from '@directus/types';
import { Request, Response } from 'express';

import { HookContext } from '../../types/hook-context';
import { loadMoneybirdContact } from './load-moneybird-contact';

export async function moneybirdHook(
  { accountability, body, schema }: Request,
  res: Response,
  apiCtx: ApiExtensionContext,
) {
  try {
    const ctx: HookContext = { ...apiCtx, accountability, schema };
    const payload: MoneybirdWebhookPayload = body;

    switch (payload.entity_type) {
      case 'Contact':
        await loadMoneybirdContact(ctx, payload.entity);
        break;
      case 'ContactPerson':
        console.log(JSON.stringify(body));
        break;
    }

    res.status(200).end();
  } catch (e) {
    res.status(500).end();
  }
}
