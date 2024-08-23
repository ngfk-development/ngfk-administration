export interface HarvestProject {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  is_billable: boolean;
  is_fixed_fee: boolean;
  bill_by: 'Project' | 'Task' | 'People' | 'none';
  budget: number | null;
  budget_by:
    | 'project'
    | 'project_cost'
    | 'task'
    | 'task_fees'
    | 'person'
    | 'none';
  budget_is_monthly: boolean;
  created_at: string;
  updated_at: string;
  starts_on: string | null;
  ends_on: string | null;
  notes: string;
  cost_budget: number | null;
  cost_budget_include_expenses: boolean;
  hourly_rate: number;
  fee: number;
  client: {
    id: number;
    name: string;
    currency: string;
  };
}
