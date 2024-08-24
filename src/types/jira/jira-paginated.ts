import { JiraIssue } from '~/types/jira/jira-issue';

export interface JiraPaginatedValues<T> {
  self: string;
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: T[];
}

export interface JiraPaginatedIssues {
  maxResults: number;
  startAt: number;
  total: number;
  issues: JiraIssue[];
}
