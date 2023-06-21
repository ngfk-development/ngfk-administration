import { randomUUID } from 'node:crypto';

import { ItemsService } from '@directus/api';

import { ExtensionContext } from '../../types/directus/extension-context';
import { JiraIssue } from '../../types/jira/jira-issue';
import { Epic } from '../../types/directus/epic';
import { Project } from '../../types/directus/project';

export async function loadJiraEpic(
  ctx: ExtensionContext,
  entity: JiraIssue,
  action: 'delete' | 'upsert',
) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Epic> = new ItemsService('app_epic', ctx);

  const jiraId = entity.id.toString();
  const [existing] = await service.readByQuery({
    filter: { id_jira: { _eq: jiraId } },
    limit: 1,
  });

  console.log(JSON.stringify(entity));

  if (action === 'delete') {
    if (existing) await service.deleteOne(existing.id);
  } else if (action === 'upsert') {
    const project = await findProject(ctx, entity.fields.project.id);

    await service.upsertOne({
      id: existing?.id ?? randomUUID(),
      id_jira: jiraId,

      key: entity.key,
      name: entity.fields.summary,
      billable: true,
      hour_rate: 0,
      ...(project ? { project: project.id } : {}),
    });
  }
}

async function findProject(ctx: ExtensionContext, id: number) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Project> = new ItemsService('app_project', ctx);

  const [project] = await service.readByQuery({
    filter: { id_jira: { _eq: id } },
    limit: 1,
  });

  return project as Project | null;
}
