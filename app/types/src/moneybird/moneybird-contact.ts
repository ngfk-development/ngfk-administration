import { MoneybirdContactPerson } from './moneybird-contact-person';
import { MoneybirdCustomField } from './moneybird-custom-field';

export interface MoneybirdContact {
  id: string;
  administration_id: string;
  company_name: string;
  address1: string;
  address2: string;
  zipcode: string;
  city: string;
  country: string;
  customer_id: string;
  tax_number: string;
  chamber_of_commerce: string;
  bank_account: string;
  created_at: Date;
  updated_at: Date;
  version: number;
  sales_invoices_url: string;
  contact_people: MoneybirdContactPerson[];
  custom_fields: MoneybirdCustomField[];
}
