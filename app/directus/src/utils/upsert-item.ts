import { AbstractServiceOptions } from '@directus/api/dist/types';
import { getItemsService } from './get-items-service';

export function upsertItem<T extends Record<string, any>>(
  services: any,
  options: AbstractServiceOptions,
  collection: string,
  item: Partial<T>,
) {
  return getItemsService<T>(services, options, collection).upsertOne(item);
}
