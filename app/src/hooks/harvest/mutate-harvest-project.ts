import type { ItemsService } from '@directus/api';

import { harvest } from '../../clients/harvest';
import { Customer } from '../../types/directus/customer';
import { ExtensionContext } from '../../types/directus/extension-context';
import { Project } from '../../types/directus/project';
import { HarvestProject } from '../../types/harvest/harvest-project';

export async function mutateHarvestProject(
  ctx: ExtensionContext,
  keys: string[],
  action: 'delete' | 'upsert',
) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Project> = new ItemsService('app_project', ctx);

  const contacts = await service.readMany(keys);
  const customers = await fetchCustomers(ctx, contacts);

  for (const contact of contacts) {
    if (action === 'delete') await deleteHarvestProject(contact);
    else if (action === 'upsert') {
      if (!contact.id_harvest) {
        const customer = customers.find((c) => c.id === contact.customer);
        if (customer) await createHarvestProject(service, customer, contact);
      } else await updateHarvestProject(contact);
    }
  }
}

async function deleteHarvestProject(project: Project) {
  if (project.id_harvest)
    await harvest.delete(`/projects/${project.id_harvest}`);
}

async function createHarvestProject(
  service: ItemsService<Project>,
  customer: Customer,
  project: Project,
) {
  const res = await harvest.post(
    '/projects',
    {},
    { params: parseProject(customer, project) },
  );

  const { id } = res.data as { id: number };
  await service.updateOne(project.id, { id_harvest: id.toString() });
}

async function updateHarvestProject(project: Project) {
  await harvest.patch(
    `/projects/${project.id_harvest}`,
    {},
    { params: parseProject(null, project) },
  );
}

function fetchCustomers(ctx: ExtensionContext, projects: Project[]) {
  const keys = projects
    .filter((project) => !project.id_harvest)
    .map((project) => project.customer!)
    .filter(Boolean);
  if (!keys.length) return [];

  const { ItemsService } = ctx.services;
  const service: ItemsService<Customer> = new ItemsService('app_customer', ctx);

  return service.readMany(keys);
}

function parseProject(customer: Customer, project: Project) {
  const harvestProject: Partial<HarvestProject> = {
    ...(customer?.id_harvest ? { client_id: +customer.id_harvest } : {}),
    bill_by: project.billable ?? 'none',
    budget_by: 'none',
    hourly_rate: project.hour_rate,
    is_active: true,
    is_billable: !!project.billable,
    name: project.name,
  };

  return harvestProject;
}
