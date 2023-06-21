import { JiraIssue } from './jira-issue';
import { JiraProject } from './jira-project';
import { JiraUser } from './jira-user';

interface JiraWebhookPayloadBase {
  timestamp: number;
  issue_event_type_name: string;
  webhookEvent: string;
}

export interface JiraWebhookProjectPayload extends JiraWebhookPayloadBase {
  project: JiraProject;
}

export interface JiraWebhookIssuePayload extends JiraWebhookPayloadBase {
  issue_event_type_name: string;
  issue: JiraIssue;
  user: JiraUser;
}

export type JiraWebhookPayload =
  | JiraWebhookProjectPayload
  | JiraWebhookIssuePayload;
