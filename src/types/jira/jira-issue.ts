import { JiraIssueStatus } from '~/types/jira/jira-issue-status';
import { JiraIssueType } from '~/types/jira/jira-issue-type';
import { JiraProject } from '~/types/jira/jira-project';

export interface JiraIssue {
  id: string;
  self: string;
  key: string;
  fields: {
    issuetype: JiraIssueType;
    project: JiraProject;
    created: string;
    updated: string;
    status: JiraIssueStatus;
    summary: string;
  };
}
