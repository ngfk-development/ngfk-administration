import { Accountability, SchemaOverview } from '@directus/types';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ADMIN_API_KEY: string;
      HARVEST_ENDPOINT: string;
      HARVEST_ACCOUNT_ID: string;
      HARVEST_TOKEN: string;
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
