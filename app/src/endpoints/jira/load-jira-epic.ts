import { ExtensionContext } from '../../types/directus/extension-context';
import { JiraIssue } from '../../types/jira/jira-issue';

export async function loadJiraEpic(
  ctx: ExtensionContext,
  entity: JiraIssue,
  action: 'delete' | 'upsert',
) {}
