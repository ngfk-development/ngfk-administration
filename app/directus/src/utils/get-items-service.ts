import { ItemsService } from '@directus/api';
import { AbstractServiceOptions } from '@directus/api/dist/types';

export function getItemsService<T extends Record<string, any>>(
  { ItemsService }: any,
  options: AbstractServiceOptions,
  name: string,
): ItemsService<T> {
  return new ItemsService(name, options);
}
