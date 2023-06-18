import { randomUUID } from 'node:crypto';

import { ItemsService } from '@directus/api';

import { ExtensionContext } from '../../types/directus/extension-context';
import { Project } from '../../types/directus/project';
import { JiraProject } from '../../types/jira/jira-project';
import { Customer } from '../../types/directus/customer';

export async function loadJiraProject(
  ctx: ExtensionContext,
  entity: JiraProject,
  action: 'delete' | 'upsert',
) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Project> = new ItemsService('app_project', ctx);

  const [customerName, projectName] = entity.name.split(' - ');
  if (!projectName) return;

  const [existing] = await service.readByQuery({
    filter: { name: { _eq: projectName }, key: { _eq: entity.key } },
    limit: 1,
  });

  if (action === 'delete') {
    if (existing) await service.deleteOne(existing.id);
  } else if (action === 'upsert') {
    const customer = await findCustomer(ctx, customerName);

    service.upsertOne({
      ...(customer ? { customer: customer.id } : {}),
      id: existing?.id ?? randomUUID(),
      id_jira: entity.id.toString(),
      name: projectName.trim(),
      key: entity.key,
    });
  }
}

async function findCustomer(ctx: ExtensionContext, name: string) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Customer> = new ItemsService('app_customer', ctx);

  const [customer] = await service.readByQuery({
    filter: { name: { _eq: name } },
    limit: 1,
  });

  return customer as Customer | null;
}
