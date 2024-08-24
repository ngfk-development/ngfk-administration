import querystring from 'node:querystring';

import { Customer, Project, Service } from '@prisma/client';

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
    this.#database.customer.subscribe('update', (data) => {
      if (data.updated_origin === Service.MONEYBIRD) return;

      if (data.harvest_id) this.contactsPatch(data);
    });

    this.#database.project.subscribe('upsert', (data) => {
      if (data.updated_origin === Service.MONEYBIRD) return;

      if (data.moneybird_id) this.projectsPatch(data);
      else this.projectsPost(data);
    });

    this.#database.project.subscribe('delete', (data) => {
      this.projectsDelete(data);
    });
  }

  async syncContacts() {
    const sync = await this.contactsSynchronizationGet();

    for await (const contact of this.iterateUpdatedContacts({ sync })) {
      await this.#database.customer.moneybirdUpsert(contact);

      for (const person of contact.contact_people) {
        await this.#database.contact.moneybirdUpsert(person);
      }
    }

    await this.#database.customer.deleteMany({
      where: { moneybird_id: { notIn: sync.map((s) => s.id) } },
    });
  }

  async syncProjects() {
    for await (const project of this.projectsGet()) {
      const data = await this.#database.project.findFirst({
        where: {
          code: project.name.split(':')[0],
          moneybird_id: null,
        },
      });

      if (data) await this.#database.project.moneybirdUpdate(data, project);
    }
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

  async contactsPatch(data: Customer) {
    await this.#fetch('PATCH', `/contacts/${data.moneybird_id}`, {
      data: {
        contact: {
          company_name: data.company_name,
          address1: data.address,
          zipcode: data.zipcode,
          city: data.city,
          country: data.country,
          chamber_of_commerce: data.chamber_of_commerce_number,
          tax_number: data.tax_number,

          custom_fields_attributes: [
            {
              id: process.env.MONEYBIRD_CUSTOM_FIELD_HARVEST_ID,
              value: data.harvest_id,
            },
          ],
        },
      },
    });
  }

  async projectsPost(data: Project) {
    if (data.moneybird_id || !data.code) return;

    const project = await this.#fetch<MoneybirdProject>('POST', '/projects', {
      data: { project: { name: `${data.code}: ${data.name}` } },
    });

    await this.#database.project.moneybirdUpdate(data, project);
  }

  async *projectsGet() {
    yield* this.#iterate<MoneybirdProject>('GET', '/projects', {
      params: { per_page: 25 },
    });
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

  async *#iterate<T = unknown>(
    method: string,
    path: string,
    options: {
      data?: Record<string, any>;
      params: { per_page: number } & querystring.ParsedUrlQueryInput;
    },
  ) {
    for (let i = 1; true; i++) {
      const page = await this.#fetch<T[]>(method, path, {
        ...options,
        params: { ...options.params, page: i },
      });

      yield* page;
      if (!page.length || page.length < options.params.per_page) break;
    }
  }

  async #fetch<T = unknown>(
    method: string,
    path: string,
    options: {
      data?: Record<string, any>;
      params?: querystring.ParsedUrlQueryInput;
    } = {},
  ): Promise<T> {
    const query = options.params
      ? `?${querystring.stringify(options.params)}`
      : '';

    const response = await fetch(`${this.#endpoint}${path}${query}`, {
      body: options.data ? JSON.stringify(options.data) : undefined,
      headers: { Authorization: `Bearer ${this.#token}` },
      method: method,
    });

    return response.json();
  }
}
