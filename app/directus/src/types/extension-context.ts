import {
  ApiExtensionContext,
  Accountability,
  SchemaOverview,
} from '@directus/types';

export type ExtensionContext = ApiExtensionContext & {
  accountability: Accountability;
  schema: SchemaOverview;
};
