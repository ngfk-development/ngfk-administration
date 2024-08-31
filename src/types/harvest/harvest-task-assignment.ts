export interface HarvestTaskAssignment {
  id: number;
  billable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  project: { id: number; name: string; code: string };
  task: { id: number; name: string };
}
