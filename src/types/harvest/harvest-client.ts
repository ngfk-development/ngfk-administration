export interface HarvestClient {
  id: number;
  name: string;
  is_active: boolean;
  address: string;
  statement_key: string;
  created_at: string;
  updated_at: string;
  currency: string;
}
