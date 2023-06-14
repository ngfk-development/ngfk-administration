import { Accountability, SchemaOverview } from '@directus/types';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ADMIN_API_KEY: string;
      MONEYBIRD_ENDPOINT: string;
      MONEYBIRD_TOKEN: string;
      MONEYBIRD_FIELD_DIRECTUS: string;
      MONEYBIRD_FIELD_HARVEST: string;
    }
  }

  namespace Express {
    interface Request {
      accountability: Accountability;
      schema: SchemaOverview;
    }
  }
}
