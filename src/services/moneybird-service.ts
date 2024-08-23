import { PrismaPromise, Project, Service } from '@prisma/client';

import { Database } from '~/types/database';
import { MoneybirdContact } from '~/types/moneybird/moneybird-contact';
import { MoneybirdEvent } from '~/types/moneybird/moneybird-event';
import { MoneybirdProject } from '~/types/moneybird/moneybird-project';
import { MoneybirdSync } from '~/types/moneybird/moneybird-sync';
import { iterateChunks } from '~/utils/iterate-chunks';

export interface MoneybirdServiceOptions {
  database: Database;
  endpoint: string;
  token: string;
  webhookToken: string;
}

export class MoneybirdService {
  #database: Database;
  #endpoint: string;
  #token: string;
  #webhookToken: string;

  constructor(options: MoneybirdServiceOptions) {
    this.#database = options.database;
    this.#endpoint = options.endpoint;
    this.#token = options.token;
    this.#webhookToken = options.webhookToken;
  }

  async handleEvent(event: MoneybirdEvent) {
    if (event.webhook_token !== this.#webhookToken) return null;

    switch (event.action) {
      case 'contact_changed':
      case 'contact_created':
        return this.#database.customer.moneybirdUpsert(event.entity);
      case 'contact_destroyed':
        return this.#database.customer.moneybirdDelete(event.entity);

      case 'contact_person_created':
      case 'contact_person_updated':
        return this.#database.contact.moneybirdUpsert(event.entity);
      case 'contact_person_destroyed':
        return this.#database.contact.moneybirdDelete(event.entity);

      default:
        return null;
    }
  }

  initializeSubscriptions() {
    this.#database.project.subscribe('upsert', (data) => {
      if (data.updated_origin === Service.MONEYBIRD) return;

      if (data.moneybird_id) this.projectsPatch(data);
      else this.projectsPost(data);
    });

    this.#database.project.subscribe('delete', (data) => {
      this.projectsDelete(data);
    });
  }

  async synchronize() {
    const tasks: PrismaPromise<any>[] = [];
    const sync = await this.contactsSynchronizationGet();

    for await (const contact of this.iterateUpdatedContacts({ sync })) {
      tasks.push(this.#database.customer.moneybirdUpsert(contact));

      for (const person of contact.contact_people) {
        tasks.push(this.#database.contact.moneybirdUpsert(person));
      }
    }

    tasks.push(
      this.#database.customer.deleteMany({
        where: { moneybird_id: { notIn: sync.map((s) => s.id) } },
      }),
    );

    await this.#database.$transaction(tasks);
  }

  async *iterateUpdatedContacts(options: { sync?: MoneybirdSync[] }) {
    const sync = options.sync ?? (await this.contactsSynchronizationGet());
    const updated = await this.#database.customer.moneybirdFindUpdated(sync);

    const ids = sync
      .filter((i) => !updated.find((u) => u.moneybird_id === i.id))
      .map((u) => u.id);

    const chunks = iterateChunks(100, ids);

    for (const ids of chunks) {
      yield* await this.contactsSynchronizationPost(ids);
    }
  }

  contactsSynchronizationGet(): Promise<MoneybirdSync[]> {
    return this.#fetch('GET', '/contacts/synchronization');
  }

  contactsSynchronizationPost(ids: string[]): Promise<MoneybirdContact[]> {
    return this.#fetch('POST', '/contacts/synchronization', { data: { ids } });
  }

  async projectsPost(data: Project) {
    if (data.moneybird_id || !data.code) return;

    const project = await this.#fetch<MoneybirdProject>('POST', '/projects', {
      data: { project: { name: `${data.code}: ${data.name}` } },
    });

    await this.#database.project.moneybirdUpdate(data, project);
  }

  async projectsPatch(data: Project) {
    if (!data.moneybird_id) return;
    if (!data.code) return this.projectsDelete(data);

    await this.#fetch('PATCH', `/projects/${data.moneybird_id}`, {
      data: { project: { name: `${data.code}: ${data.name}` } },
    });
  }

  async projectsDelete(data: Project) {
    if (!data.moneybird_id) return;
    await this.#fetch('DELETE', `/projects/${data.moneybird_id}`);
  }

  async #fetch<T = unknown>(
    method: string,
    path: string,
    options: { data?: Record<string, any> } = {},
  ): Promise<T> {
    const response = await fetch(`${this.#endpoint}${path}`, {
      body: options.data ? JSON.stringify(options.data) : undefined,
      headers: { Authorization: `Bearer ${this.#token}` },
      method: method,
    });

    return response.json();
  }
}
