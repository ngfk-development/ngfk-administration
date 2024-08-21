import { MoneybirdContactPerson } from '~/types/moneybird/moneybird-contact-person';

export interface MoneybirdContact {
  id: string;
  version: number;
  customer_id: string;

  company_name: string;
  address1: string;
  zipcode: string;
  city: string;
  country: string;

  chamber_of_commerce: string;
  tax_number: string;
  phone: string;

  contact_people: MoneybirdContactPerson[];
}
