import { ItemsService } from '@directus/api';

import { moneybird } from '../../clients/moneybird';
import { ExtensionContext } from '../../types/directus/extension-context';
import { Project } from '../../types/directus/project';
import { Customer } from '../../types/directus/customer';
import { TimeEntry } from '../../types/directus/time-entry';
import { MoneybirdTimeEntry } from '../../types/moneybird/moneybird-time-entry';

export async function mutateMoneybirdTimeEntry(
  ctx: ExtensionContext,
  keys: string[],
  action: 'delete' | 'upsert',
) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<TimeEntry> = new ItemsService(
    'app_time_entry',
    ctx,
  );

  const entries = await service.readMany(keys);

  for (const entry of entries) {
    if (action === 'delete') await deleteMoneybirdTimeEntry(entry);
    else if (action === 'upsert') {
      const customer = await findCustomer(ctx, entry);
      const project = await findProject(ctx, entry);

      if (!entry.id_moneybird)
        await createMoneybirdTimeEntry(service, entry, customer, project);
      else await updateMoneybirdTimeEntry(entry, customer, project);
    }
  }
}

async function deleteMoneybirdTimeEntry(entry: TimeEntry) {
  if (entry.id_moneybird)
    await moneybird.delete(`/time_entries/${entry.id_moneybird}`);
}

async function createMoneybirdTimeEntry(
  service: ItemsService<TimeEntry>,
  entry: TimeEntry,
  customer?: Customer | null,
  project?: Project | null,
) {
  const res = await moneybird.post('/time_entries', {
    time_entry: parseTimeEntry(entry, customer, project),
  });

  const { id } = res.data as { id: string };
  await service.updateOne(entry.id, { id_moneybird: id });
}

async function updateMoneybirdTimeEntry(
  entry: TimeEntry,
  customer?: Customer | null,
  project?: Project | null,
) {
  await moneybird.patch(`/time_entries/${entry.id_moneybird}`, {
    time_entry: parseTimeEntry(entry, customer, project),
  });
}

async function findCustomer(ctx: ExtensionContext, entry: TimeEntry) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Customer> = new ItemsService('app_customer', ctx);
  return entry.customer ? service.readOne(entry.customer) : null;
}

async function findProject(ctx: ExtensionContext, entry: TimeEntry) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Project> = new ItemsService('app_project', ctx);
  return entry.project ? service.readOne(entry.project) : null;
}

function parseTimeEntry(
  entry: TimeEntry,
  customer?: Customer | null,
  project?: Project | null,
) {
  return {
    started_at: entry.date_start,
    ended_at: entry.date_end,
    description: entry.notes || '-',
    contact_id: customer?.id_moneybird,
    project_id: project?.id_moneybird,
    user_id: '390107417314067505',
    billable: entry.billable,
  } as MoneybirdTimeEntry;
}
