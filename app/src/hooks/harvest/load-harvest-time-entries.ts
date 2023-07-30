import { randomUUID } from 'node:crypto';

import { ItemsService } from '@directus/api';
import moment from 'moment';

import { harvest } from '../../clients/harvest';
import { Customer } from '../../types/directus/customer';
import { Epic } from '../../types/directus/epic';
import { ExtensionContext } from '../../types/directus/extension-context';
import { Project } from '../../types/directus/project';
import {
  HarvestTimeEntry,
  HarvestTimeEntryPage,
} from '../../types/harvest/harvest-time-entry';
import { TimeEntry } from '../../types/directus/time-entry';

export async function loadHarvestTimeEntries(ctx: ExtensionContext) {
  const services = createServices(ctx);
  const entries = await fetchTimeEntries();

  const [customers, projects, epics, existing] = await Promise.all([
    services.customer.readByQuery({
      filter: { id_harvest: { _in: entries.map((entry) => entry.client.id) } },
    }),
    services.project.readByQuery({
      filter: { id_harvest: { _in: entries.map((entry) => entry.project.id) } },
    }),
    services.epic.readByQuery({
      filter: { id_harvest: { _in: entries.map((entry) => entry.task.id) } },
    }),
    services.timeEntry.readByQuery({
      filter: { id_harvest: { _in: entries.map((entry) => entry.id) } },
    }),
  ]);

  const data: TimeEntry[] = [];

  for (const harvestEntry of entries) {
    const {
      id: harvestId,
      spent_date: spentDate,
      started_time: startedTime,
      ended_time: endedTime,
      notes,
      billable,
      client: { id: clientId },
      project: { id: projectId },
      task: { id: taskId },
    } = harvestEntry;

    const current = existing.find((e) => e.id_harvest === `${harvestId}`);
    const customer = customers.find((c) => c.id_harvest === `${clientId}`);
    const project = projects.find((p) => p.id_harvest === `${projectId}`);
    const epic = epics.find((e) => e.id_harvest === `${taskId}`);

    data.push({
      id: current?.id ?? randomUUID(),
      id_moneybird: current?.id_moneybird,
      id_harvest: harvestId.toString(),

      customer: customer?.id,
      project: project?.id,
      epic: epic?.id,
      date_start: parseDate(spentDate, startedTime).toISOString(),
      date_end: parseDate(spentDate, endedTime).toISOString(),
      billable: !!billable,
      notes: notes || '',
    });
  }

  await services.timeEntry.upsertMany(data);
  await services.timeEntry.deleteByQuery({
    filter: { id_harvest: { _nin: entries.map((entry) => entry.id) } },
  });
}

function createServices(ctx: ExtensionContext) {
  const { ItemsService } = ctx.services;

  return {
    customer: new ItemsService('app_customer', ctx) as ItemsService<Customer>,
    project: new ItemsService('app_project', ctx) as ItemsService<Project>,
    epic: new ItemsService('app_epic', ctx) as ItemsService<Epic>,
    timeEntry: new ItemsService(
      'app_time_entry',
      ctx,
    ) as ItemsService<TimeEntry>,
  };
}

async function fetchTimeEntries() {
  const entries: HarvestTimeEntry[] = [];
  let page: number | null = 1;

  do {
    const response = await harvest.get('time_entries', {
      params: { page, is_running: false },
    });

    const data = response.data as HarvestTimeEntryPage;
    entries.push(...data.time_entries);

    page = data.next_page;
  } while (page != null);

  return entries;
}

function parseDate(day: string, time: string) {
  return moment.utc(`${day} ${time}'`, 'YYYY-MM-DD h:mmA').toDate();
}
