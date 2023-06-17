import {
  ApiExtensionContext,
  Accountability,
  SchemaOverview,
} from '@directus/types';

export type ExtensionContext = ApiExtensionContext & {
  accountability: Accountability | null;
  schema: SchemaOverview | null;
};
