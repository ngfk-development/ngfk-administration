import {
  ApiExtensionContext,
  Accountability,
  SchemaOverview,
} from '@directus/types';

export type HookContext = ApiExtensionContext & {
  accountability: Accountability;
  schema: SchemaOverview;
};
