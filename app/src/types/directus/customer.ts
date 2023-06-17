export interface Customer {
  id: string;
  id_harvest?: string;
  id_moneybird?: string;

  name: string;
  street: string;
  postal_code: string;
  city: string;
  kvk_number: string;
  vat_number: string;
}
