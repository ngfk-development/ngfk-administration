export interface HarvestTimeEntry {
  id: number;
  spent_date: string;
  started_time: string;
  ended_time: string;
  hours: number;
  notes?: string;
  billable: boolean;
  client: { id: number; name: string };
  project: { id: number; name: string; code: string };
  task: { id: number; name: string };
}

export interface HarvestTimeEntryPage {
  time_entries: HarvestTimeEntry[];
  per_page: number;
  total_pages: number;
  total_entries: number;
  next_page: number | null;
  previous_page: number | null;
  page: number;
  links: {
    first: string;
    next: string | null;
    previous: string | null;
    last: string;
  };
}
