import { MoneybirdContact } from './moneybird-contact';
import { MoneybirdContactPerson } from './moneybird-contact-person';

interface MoneybirdWebhookPayloadBase<Type extends string, Entity> {
  action: string;
  administration_id: string;
  entity_id: string;
  entity_type: Type;
  entity: Entity;
  state: string;
  webhook_id: string;
  webhook_token: string;
}

export type MoneybirdWebhookPayload =
  | MoneybirdWebhookPayloadBase<'ContactPerson', MoneybirdContactPerson>
  | MoneybirdWebhookPayloadBase<'Contact', MoneybirdContact>;
