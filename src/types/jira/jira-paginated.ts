export interface JiraPaginated<T> {
  self: string;
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: T[];
}
