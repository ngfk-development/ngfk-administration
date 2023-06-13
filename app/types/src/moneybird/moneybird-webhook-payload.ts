import { MoneybirdContact } from './moneybird-contact';
import { MoneybirdContactPerson } from './moneybird-contact-person';

interface EntityMap {
  contact: ['ContactPerson', MoneybirdContactPerson];
  customer: ['Contact', MoneybirdContact];
}

export interface MoneybirdWebhookPayload<
  T extends keyof EntityMap = keyof EntityMap,
> {
  action: string;
  administration_id: string;
  entity_id: string;
  entity_type: EntityMap[T][0];
  entity: EntityMap[T][1];
  state: string;
  webhook_id: string;
  webhook_token: string;
}
