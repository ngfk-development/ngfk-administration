export interface TimeEntry {
  id: string;
  id_moneybird?: string;
  id_harvest?: string;

  customer?: string;
  project?: string;
  epic?: string;
  date_start: string;
  date_end: string;
  billable: boolean;
  notes: string;
}
