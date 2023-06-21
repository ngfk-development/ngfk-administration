export interface Project {
  id: string;
  id_moneybird?: string;
  id_harvest?: string;
  id_jira?: string;

  name: string;
  key: string;
  billable?: 'project' | 'task';
  hour_rate: number;
  customer?: string;
}
