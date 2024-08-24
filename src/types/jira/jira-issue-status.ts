export interface JiraIssueStatus {
  id: string;
  self: string;
  description: string;
  iconUrl: string;
  name: string;
  statusCategory: {
    id: number;
    self: string;
    key: string;
    colorName: string;
    name: string;
  };
}
