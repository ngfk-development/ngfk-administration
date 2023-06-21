import type { ItemsService } from '@directus/api';

import { harvest } from '../../clients/harvest';
import { Epic } from '../../types/directus/epic';
import { ExtensionContext } from '../../types/directus/extension-context';
import { Project } from '../../types/directus/project';
import { HarvestTask } from '../../types/harvest/harvest-task';

export async function mutateHarvestTask(
  ctx: ExtensionContext,
  keys: string[],
  action: 'delete' | 'upsert',
) {
  const { ItemsService } = ctx.services;
  const service: ItemsService<Epic> = new ItemsService('app_epic', ctx);

  const epics = await service.readMany(keys);
  const projects = await fetchProjects(ctx, epics);

  for (const epic of epics) {
    if (action === 'delete') await deleteHarvestTask(epic);
    else if (action === 'upsert') {
      if (!epic.id_harvest || !epic.id_harvest_assignment) {
        const project = projects.find((p) => p.id === epic.project);
        if (project) await createHarvestTask(service, project, epic);
      } else await updateHarvestTask(epic);
    }
  }
}

async function deleteHarvestTask(epic: Epic) {
  if (epic.id_harvest) await harvest.delete(`/tasks/${epic.id_harvest}`);
}

async function createHarvestTask(
  service: ItemsService<Epic>,
  project: Project,
  epic: Epic,
) {
  const res1 = await harvest.post('/tasks', {}, { params: parseEpic(epic) });
  const { id: harvestId } = res1.data as { id: number };

  const res2 = await harvest.post(
    `/projects/${project.id_harvest}/task_assignments`,
    {},
    { params: { task_id: harvestId } },
  );
  const { id: harvestAssignmentId } = res2.data as { id: number };

  await service.updateOne(epic.id, {
    id_harvest: harvestId.toString(),
    id_harvest_assignment: harvestAssignmentId.toString(),
  });
}

async function updateHarvestTask(epic: Epic) {
  await harvest.patch(
    `/tasks/${epic.id_harvest}`,
    {},
    { params: parseEpic(epic) },
  );
}

function fetchProjects(ctx: ExtensionContext, epics: Epic[]) {
  const keys = epics
    .filter((epic) => !epic.id_harvest)
    .map((epic) => epic.project!)
    .filter(Boolean);
  if (!keys.length) return [];

  const { ItemsService } = ctx.services;
  const service: ItemsService<Project> = new ItemsService('app_project', ctx);

  return service.readMany(keys);
}

function parseEpic(epic: Epic) {
  const task: Partial<HarvestTask> = {
    name: `${epic.key} ${epic.name}`,
    billable_by_default: epic.billable,
    default_hourly_rate: new Intl.NumberFormat('nl-NL').format(epic.hour_rate),
    is_active: true,
  };

  return task;
}
