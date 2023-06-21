export interface HarvestProject {
  name: string;
  client_id: number | null;
  bill_by: 'Project' | 'Task' | 'none';
  budget_by: 'none';
  hourly_rate: string;
  is_billable: boolean;
  is_active: boolean;
}
