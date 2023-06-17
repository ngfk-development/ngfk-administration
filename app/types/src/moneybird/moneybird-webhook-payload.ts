import { MoneybirdContact } from './moneybird-contact';
import { MoneybirdContactPerson } from './moneybird-contact-person';

interface MoneybirdWebhookPayloadBase<
  Type extends string,
  Entity,
  Action extends string,
> {
  action: Action;
  administration_id: string;
  entity_id: string;
  entity_type: Type;
  entity: Entity;
  state: string;
  webhook_id: string;
  webhook_token: string;
}

export type MoneybirdWebhookContactPayload = MoneybirdWebhookPayloadBase<
  'Contact',
  MoneybirdContact,
  | 'contact_archived'
  | 'contact_activated'
  | 'contact_changed'
  | 'contact_created'
  | 'contact_created_from_checkout_order'
  | 'contact_destroyed'
  | 'contact_mandate_request_failed'
  | 'contact_mandate_request_initiated'
  | 'contact_mandate_request_succeeded'
  | 'contact_merged'
>;

export type MoneybirdWebhookContactPersonPayload = MoneybirdWebhookPayloadBase<
  'ContactPerson',
  MoneybirdContactPerson,
  | 'contact_person_created'
  | 'contact_person_destroyed'
  | 'contact_person_updated'
>;

export type MoneybirdWebhookPayload =
  | MoneybirdWebhookContactPayload
  | MoneybirdWebhookContactPersonPayload;
