import { readFile, writeFile } from 'node:fs/promises';

import { Command } from 'commander';
import { dump, load } from 'js-yaml';

import { ExtensionContext } from '../../types/directus/extension-context';
import { ItemsService } from '@directus/api';

export function commandData(ctx: ExtensionContext, program: Command) {
  const data = program.command('data');

  data
    .command('apply')
    .description('Seed .yml files into your database.')
    .argument('<file>')
    .action(apply);

  data
    .command('snapshot')
    .description('Dump a table to a file')
    .argument('<file>')
    .argument('<collections...>')
    .action(snapshot);

  async function apply(file: string) {
    try {
      const { ItemsService } = ctx.services;
      const fileContents = await readFile(file, 'utf8');
      const data = load(fileContents) as Record<string, any>;

      for (const collection in data) {
        const service: ItemsService = new ItemsService(collection, ctx);
        await service.upsertMany(data[collection]);
      }

      process.exit(0);
    } catch {
      process.exit(1);
    }
  }

  async function snapshot(file: string, collections: string[]) {
    try {
      const { ItemsService } = ctx.services;
      const data: Record<string, any[]> = {};

      for (const collection of collections) {
        const service: ItemsService = new ItemsService(collection, ctx);
        data[collection] = await service.readByQuery({});
      }

      await writeFile(file, dump(data), 'utf-8');
      process.exit(0);
    } catch {
      process.exit(1);
    }
  }
}
