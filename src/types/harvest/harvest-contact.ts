export interface HarvestContact {
  id: number;
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_office: string;
  phone_mobile: string;
  fax: string;
  create_at: string;
  update_at: string;
  client: { id: number; name: string };
}
