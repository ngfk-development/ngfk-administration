import { Prisma, Project, Service } from '@prisma/client';

export function withJira() {
  return Prisma.defineExtension({
    name: 'jira',
    model: {
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
