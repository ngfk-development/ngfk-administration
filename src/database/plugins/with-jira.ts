import { Prisma, Project } from '@prisma/client';

import { JiraIssue } from '~/types/jira/jira-issue';
import { JiraProject } from '~/types/jira/jira-project';

export function withJira() {
  return Prisma.defineExtension({
    name: 'jira',
    model: {
      epic: {
        jiraUpsert<T>(this: T, issue: JiraIssue) {
          const delegate = this as Prisma.EpicDelegate;

          const data: Prisma.EpicCreateInput = {
            jira_id: issue.id,
            code: issue.key,
            title: issue.fields.summary,
            status: issue.fields.status.name,
            archived: issue.fields.status.statusCategory.name === 'Done',
            project: { connect: { jira_id: issue.fields.project.id } },
          };

          return delegate.upsert({
            where: { jira_id: issue.id },
            create: data,
            update: data,
          });
        },
      },
      project: {
        jiraUpdate<T>(
          this: T,
          data: Pick<Project, 'id'>,
          project: Pick<JiraProject, 'id'>,
        ) {
          const delegate = this as Prisma.ProjectDelegate;

          return delegate.update({
            where: { id: data.id },
            data: { jira_id: project.id.toString() },
          });
        },
      },
    },
  });
}
