export type HarvestPaginated<K extends string, T> = Record<K, T[]> & {
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
};
