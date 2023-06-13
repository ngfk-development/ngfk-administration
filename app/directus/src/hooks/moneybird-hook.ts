import { Request, Response } from 'express';

export async function moneybirdHook(req: Request, res: Response) {
  try {
    console.log(typeof req.body);
    console.log(req.body);
    res.status(200).end();
  } catch {
    res.status(500).end();
  }
}
