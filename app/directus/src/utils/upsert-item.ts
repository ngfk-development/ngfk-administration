import { ItemsService as Service } from '@directus/api';
import { camelToSnakeCase } from './change-casing';
import { HookContext } from '../types/hook-context';

export function upsertItem<T extends Record<string, any>>(
  ctx: HookContext,
  collection: string,
  data: Partial<T>,
) {
  const { ItemsService } = ctx.services;
  const service: Service = new ItemsService(`app_${collection}`, ctx);
  const item = camelToSnakeCase(data);
  return service.upsertOne(item);
}
