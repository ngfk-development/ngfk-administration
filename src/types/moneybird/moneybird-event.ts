import { MoneybirdContact } from '~/types/moneybird/moneybird-contact';
import { MoneybirdContactPerson } from '~/types/moneybird/moneybird-contact-person';

export interface MoneybirdBaseEvent<
  T extends string,
  E extends Record<string, any>,
  A extends string,
> {
  administration_id: string;
  webhook_id: string;
  webhook_token: string;
  action: A;
  entity_type: T;
  entity_id: string;
  entity: E;
}

export type MoneybirdEvent =
  | MoneybirdContactEvent
  | MoneybirdContactPersonEvent;

type MoneybirdContactEvent = MoneybirdBaseEvent<
  'Contact',
  MoneybirdContact,
  'contact_created' | 'contact_changed' | 'contact_destroyed'
>;

type MoneybirdContactPersonEvent = MoneybirdBaseEvent<
  'ContactPerson',
  MoneybirdContactPerson,
  | 'contact_person_created'
  | 'contact_person_destroyed'
  | 'contact_person_updated'
>;
