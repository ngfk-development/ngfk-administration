export interface JiraIssueType {
  id: string;
  self: string;
  description: string;
  iconUrl: string;
  name: string;
  subtask: boolean;
  hierarchyLevel: number;
}
