export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: string;
    project: {
      id: number;
      self: string;
      key: string;
      name: string;
      projectTypeKey: string;
      simplified: boolean;
    };
  };
  self: string;
}
