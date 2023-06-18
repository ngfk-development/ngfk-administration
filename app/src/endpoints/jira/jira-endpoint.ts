import { ApiExtensionContext } from '@directus/types';
import { Request, Response } from 'express';

export async function jiraEndpoint(
  req: Request,
  res: Response,
  _apiCtx: ApiExtensionContext,
) {
  try {
    console.log(JSON.stringify(req.body));

    res.status(200).end();
  } catch (e) {
    console.log(JSON.stringify(e));
    res.status(500).end();
  }
}
