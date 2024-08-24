import { Prisma, Project, Service } from '@prisma/client';

import { JiraIssue } from '~/types/jira/jira-issue';

export function withJira() {
  return Prisma.defineExtension({
    name: 'jira',
    model: {
      epic: {
        jiraUpsert<T>(this: T, issue: JiraIssue) {
          const delegate = this as Prisma.EpicDelegate;

          const data: Omit<Prisma.EpicCreateInput, 'created_origin'> = {
            jira_id: issue.id,
            code: issue.key,
            title: issue.fields.summary,
            status: issue.fields.status.name,
            archived: issue.fields.status.statusCategory.name === 'Done',
            updated_origin: Service.JIRA,
            project: { connect: { jira_id: issue.fields.project.id } },
          };

          return delegate.upsert({
            where: { jira_id: issue.id },
            create: { ...data, created_origin: Service.JIRA },
            update: data,
          });
        },
      },
      project: {
        jiraUpdate<T>(this: T, data: Project, project: { id: number }) {
          const delegate = this as Prisma.ProjectDelegate;

          return delegate.update({
            where: { id: data.id },
            data: {
              jira_id: project.id.toString(),
              updated_origin: Service.JIRA,
            },
          });
        },
      },
    },
  });
}
