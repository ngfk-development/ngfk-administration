import { ItemsService } from '@directus/api';

import { moneybird } from '../../clients/moneybird';
import { ExtensionContext } from '../../types/directus/extension-context';
import { Project } from '../../types/directus/project';

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
      if (!project.id_moneybird) await createMoneybirdProject(service, project);
      else await updateMoneybirdProject(project);
    }
  }
}

async function deleteMoneybirdProject(project: Project) {
  if (project.id_moneybird)
    await moneybird.delete(`/projects/${project.id_moneybird}`);
}

async function createMoneybirdProject(
  service: ItemsService<Project>,
  project: Project,
) {
  const res = await moneybird.post('/projects', {
    project: { name: project.name },
  });

  const { id } = res.data as { id: string };
  await service.updateOne(project.id, { id_moneybird: id });
}

async function updateMoneybirdProject(project: Project) {
  await moneybird.patch(`/projects/${project.id_moneybird}`, {
    project: { name: `${project.key} ${project.name}` },
  });
}
