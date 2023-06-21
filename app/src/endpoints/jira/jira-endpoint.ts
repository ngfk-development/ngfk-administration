import { ApiExtensionContext } from '@directus/types';
import { Request, Response } from 'express';

import { ExtensionContext } from '../../types/directus/extension-context';
import { JiraWebhookPayload } from '../../types/jira/jira-webhook-payload';
import { loadJiraEpic } from './load-jira-epic';
import { loadJiraProject } from './load-jira-project';

export async function jiraEndpoint(
  { accountability, body, schema }: Request,
  res: Response,
  apiCtx: ApiExtensionContext,
) {
  try {
    const ctx: ExtensionContext = { ...apiCtx, accountability, schema };
    const payload: JiraWebhookPayload = body;
    const { issue_event_type_name: event } = payload;
    const action = event.endsWith('_deleted') ? 'delete' : 'upsert';

    if (event.startsWith('project') && 'project' in payload)
      await loadJiraProject(ctx, payload.project, action);
    else if (event.startsWith('issue') && 'issue' in payload)
      await loadJiraEpic(ctx, payload.issue, action);

    res.status(200).end();
  } catch (e) {
    console.log(JSON.stringify(e));
    res.status(500).end();
  }
}
