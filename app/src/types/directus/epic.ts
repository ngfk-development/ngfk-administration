export interface Epic {
  id: string;
  id_harvest_assignment?: string;
  id_harvest?: string;
  id_jira?: string;

  key: string;
  name: string;
  date_start?: Date;
  date_end?: Date;
  billable: boolean;
  hour_rate: number;
  project?: string;
}
