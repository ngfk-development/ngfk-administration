export interface HarvestProject {
  name: string;
  client_id: number | null;
  code: string;
  bill_by: 'Project' | 'Task' | 'none';
  budget_by: 'project' | 'none';
  hourly_rate: string;
  budget: string;
  fee: string;
  is_fixed_fee: boolean;
  is_billable: boolean;
  is_active: boolean;
}
