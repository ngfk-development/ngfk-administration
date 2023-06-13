import { Accountability, SchemaOverview } from '@directus/types';

declare global {
  namespace Express {
    interface Request {
      accountability: Accountability;
      schema: SchemaOverview;
    }
  }
}
