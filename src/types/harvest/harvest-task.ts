export interface HarvestTask {
  id: number;
  name: string;
  billable_by_default: boolean;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  default_hourly_rate: number;
}
