export interface Customer {
  id: string;
  idHarvest?: string;
  idMoneybird?: string;

  name: string;
  street: string;
  postalCode: string;
  city: string;
  kvkNumber: string;
  vatNumber: string;
}
