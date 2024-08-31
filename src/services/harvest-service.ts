import querystring from 'node:querystring';

import { Contact, Customer, Epic, Service } from '@prisma/client';

import { Database } from '~/types/database';
import { HarvestClient } from '~/types/harvest/harvest-client';
import { HarvestContact } from '~/types/harvest/harvest-contact';
import { HarvestPaginated } from '~/types/harvest/harvest-paginated';
import { HarvestProject } from '~/types/harvest/harvest-project';
import { HarvestTask } from '~/types/harvest/harvest-task';
import { HarvestTaskAssignment } from '~/types/harvest/harvest-task-assignment';

export interface HarvestServiceOptions {
  accountId: string;
  database: Database;
  endpoint: string;
  token: string;
}

export class HarvestService {
  #accountId: string;
  #database: Database;
  #endpoint: string;
  #token: string;

  constructor(options: HarvestServiceOptions) {
    this.#accountId = options.accountId;
    this.#database = options.database;
    this.#endpoint = options.endpoint;
    this.#token = options.token;
  }

  initializeSubscriptions() {
    this.#database.customer.subscribe('upsert', (data) => {
      if (data.updated_origin === Service.HARVEST) return;

      if (!data.harvest_id) this.clientsPost(data);
      else this.clientsPatch(data);
    });

    this.#database.customer.subscribe('delete', (data) => {
      this.clientsDelete(data);
    });

    this.#database.contact.subscribe('upsert', (data) => {
      if (data.updated_origin === Service.HARVEST) return;

      if (!data.harvest_id) this.contactsPost(data);
      else this.contactsPatch(data);
    });

    this.#database.contact.subscribe('delete', (data) => {
      this.contactsDelete(data);
    });

    this.#database.epic.subscribe('upsert', (data) => {
      if (data.updated_origin === Service.HARVEST) return;

      if (!data.harvest_id) this.tasksPost(data);
      else this.tasksPatch(data);
    });

    this.#database.epic.subscribe('delete', (data) => {
      this.tasksDelete(data);
    });
  }

  async syncContacts() {
    for await (const contact of this.contactsGet()) {
      const data = await this.#database.contact.findFirst({
        where: {
          customer: { harvest_id: contact.client.id },
          first_name: contact.first_name,
          last_name: contact.last_name,
        },
      });

      if (!data) return;
      if (
        !data.harvest_id ||
        data.updated_at.getTime() < new Date(contact.update_at).getTime()
      ) {
        await this.#database.contact.harvestUpdate(data, contact);
      }
    }
  }

  async syncProjects() {
    for await (const project of this.projectsGet()) {
      const data = await this.#database.project.findUnique({
        where: { harvest_id: project.id },
      });

      if (
        !data ||
        data.updated_at.getTime() < new Date(project.updated_at).getTime()
      ) {
        await this.#database.project.harvestUpsert(project);
      }
    }
  }

  async syncTasks() {
    for await (const task of this.tasksGet()) {
      const match = task.name.match(/^([0-9A-Z]+-[0-9]+) (.*)$/);
      if (!match) continue;

      const data = await this.#database.epic.findUnique({
        where: { code: match[1] },
      });

      if (data) await this.#database.epic.harvestUpdate(data, task);
    }

    for await (const taskAssignment of this.taskAssignmentGet()) {
      const data = await this.#database.epic.findFirst({
        where: {
          harvest_id: taskAssignment.task.id,
          harvest_assignment_id: null,
        },
      });

      if (data) {
        await this.#database.epic.update({
          where: { id: data.id },
          data: { harvest_assignment_id: taskAssignment.id },
        });
      }
    }
  }

  async clientsDelete(data: Customer) {
    if (!data.harvest_id) return;
    await this.#fetch<HarvestClient>('DELETE', `/clients/${data.harvest_id}`);
  }

  async clientsPatch(data: Customer) {
    if (!data.harvest_id) return;

    await this.#fetch('PATCH', `/clients/${data.harvest_id!}`, {
      params: {
        name: data.company_name,
        is_active: true,
        address: `${data.address}\n${data.zipcode} ${data.city}`,
        currency: 'EUR',
      },
    });
  }

  async clientsPost(data: Customer) {
    const client = await this.#fetch<HarvestClient>('POST', '/clients', {
      params: {
        name: data.company_name,
        is_active: true,
        address: `${data.address}\n${data.zipcode} ${data.city}`,
        currency: 'EUR',
      },
    });

    await this.#database.customer.harvestUpdate(data, client);
  }

  async *contactsGet() {
    yield* this.#iterate<'contacts', HarvestContact>(
      'GET',
      '/contacts',
      'contacts',
      { params: { per_page: 2000 } },
    );
  }

  async contactsPatch(data: Contact) {
    if (!data.harvest_id) return;

    await this.#fetch('PATCH', `/contacts/${data.harvest_id}`, {
      params: {
        first_name: data.first_name,
        last_name: data.last_name,
        title: data.title,
        email: data.email,
        phone_mobile: data.phone,
      },
    });
  }

  async contactsPost(data: Contact) {
    const customer = await this.#database.customer.findUnique({
      where: { id: data.customer_id },
    });

    if (!customer?.harvest_id) return;

    const contact = await this.#fetch<HarvestContact>('POST', '/contacts', {
      params: {
        client_id: customer.harvest_id,
        first_name: data.first_name,
        last_name: data.last_name,
        title: data.title,
        email: data.email,
        phone_mobile: data.phone,
      },
    });

    await this.#database.contact.harvestUpdate(data, contact);
  }

  async contactsDelete(data: Contact) {
    if (!data.harvest_id) return;
    await this.#fetch('DELETE', `/contacts/${data.harvest_id}`);
  }

  async *projectsGet() {
    yield* this.#iterate<'projects', HarvestProject>(
      'GET',
      '/projects',
      'projects',
      { params: { per_page: 2000 } },
    );
  }

  async tasksPost(data: Epic) {
    const project = await this.#database.project.findUnique({
      where: { id: data.project_id },
    });

    const task = await this.#fetch<HarvestTask>('POST', '/tasks', {
      params: {
        name: `${data.code} ${data.title}`,
        is_active: !data.archived,
      },
    });

    const assignment = await this.#fetch<HarvestTaskAssignment>(
      'POST',
      `/projects/${project?.harvest_id!}/task_assignments`,
      { params: { task_id: task.id } },
    );

    await this.#database.epic.harvestUpdate(data, task, assignment);
  }

  async *taskAssignmentGet() {
    yield* this.#iterate<'task_assignments', HarvestTaskAssignment>(
      'GET',
      '/task_assignments',
      'task_assignments',
      { params: { per_page: 2000 } },
    );
  }

  async *tasksGet() {
    yield* this.#iterate<'tasks', HarvestTask>('GET', '/tasks', 'tasks', {
      params: { per_page: 2000 },
    });
  }

  async tasksPatch(data: Epic) {
    if (!data.harvest_id) return;

    await this.#fetch('PATCH', `/tasks/${data.harvest_id}`, {
      params: {
        name: `${data.code} ${data.title}`,
        is_active: !data.archived,
      },
    });
  }

  async tasksDelete(data: Epic) {
    if (!data.harvest_id) return;
    await this.#fetch('DELETE', `/tasks/${data.harvest_id}`);
  }

  async *#iterate<K extends string, T = unknown>(
    method: string,
    path: string,
    key: K,
    options: { params: { per_page: number } & querystring.ParsedUrlQueryInput },
  ) {
    for (let i = 1; true; i++) {
      const page = await this.#fetch<HarvestPaginated<K, T>>(method, path, {
        ...options,
        params: {
          ...options.params,
          page: i,
          per_page: options.params.per_page,
        },
      });

      yield* page[key];

      if (!page.next_page) break;
    }
  }

  async #fetch<T = unknown>(
    method: string,
    path: string,
    options: { params?: querystring.ParsedUrlQueryInput } = {},
  ): Promise<T> {
    const query = options.params
      ? `?${querystring.stringify(options.params)}`
      : '';

    const response = await fetch(`${this.#endpoint}${path}${query}`, {
      method: method,
      headers: {
        'Authorization': `Bearer ${this.#token}`,
        'Harvest-Account-Id': this.#accountId,
      },
    });

    return response.json();
  }
}
