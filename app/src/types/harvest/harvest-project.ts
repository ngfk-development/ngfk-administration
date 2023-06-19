export interface HarvestProject {
  name: string;
  client_id: number | null;
  bill_by: string;
  budget_by: 'none';
  hourly_rate: number;
  is_billable: boolean;
  is_active: boolean;
}
