export interface HarvestClient {
  harvest_id: number | null;
  name: string;
  address: string;
  currency: 'EUR';
  is_active: boolean;
}
