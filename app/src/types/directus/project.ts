export interface Project {
  id: string;
  id_moneybird?: string;
  id_harvest?: string;
  id_jira?: string;

  name: string;
  key: string;
  billable?: 'project' | 'task' | 'fixed';
  hour_rate: number;
  fee: number;
  budget: number;
  customer?: string;
}
