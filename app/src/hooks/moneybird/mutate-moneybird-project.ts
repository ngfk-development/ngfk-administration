import { ItemsService } from '@directus/api';

import { moneybird } from '../../clients/moneybird';
import { ExtensionContext } from '../../types/directus/extension-context';
import { Project } from '../../types/directus/project';
import { Customer } from '../../types/directus/customer';

export async function mutateMoneybirdProject(
  ctx: ExtensionContext,
  keys: string[],
  action: 'delete' | 'upsert',
) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Project> = new ItemsService('app_project', ctx);

  const projects = await service.readMany(keys);

  for (const project of projects) {
    if (action === 'delete') await deleteMoneybirdProject(project);
    else if (action === 'upsert') {
      const customer = await findCustomer(ctx, project);
      if (!customer) continue;

      if (!project.id_moneybird)
        await createMoneybirdProject(service, customer, project);
      else await updateMoneybirdProject(customer, project);
    }
  }
}

async function deleteMoneybirdProject(project: Project) {
  if (project.id_moneybird)
    await moneybird.delete(`/projects/${project.id_moneybird}`);
}

async function createMoneybirdProject(
  service: ItemsService<Project>,
  customer: Customer,
  project: Project,
) {
  const res = await moneybird.post('/projects', {
    project: { name: `${customer.name} - ${project.name}` },
  });

  const { id } = res.data as { id: string };
  await service.updateOne(project.id, { id_moneybird: id });
}

async function updateMoneybirdProject(customer: Customer, project: Project) {
  await moneybird.patch(`/projects/${project.id_moneybird}`, {
    project: { name: `${customer.name} - ${project.name}` },
  });
}

async function findCustomer(ctx: ExtensionContext, project: Project) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Customer> = new ItemsService('app_customer', ctx);
  return project.customer ? service.readOne(project.customer) : null;
}
