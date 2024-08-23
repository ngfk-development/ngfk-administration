import querystring from 'node:querystring';

import { Contact, Customer, Service } from '@prisma/client';

import { Database } from '~/types/database';
import { HarvestContact } from '~/types/harvest/harvest-contact';
import { HarvestClient } from '~/types/harvest/harvest-client';
import { HarvestProject } from '~/types/harvest/harvest-project';

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
  }

  async synchronize() {
    const lastUpdate = await this.#database.project.harvestLastUpdate();
    const projects = await this.projectsGet({ updated_since: lastUpdate });

    await this.#database.$transaction(
      projects.map((project) => this.#database.project.harvestUpsert(project)),
    );
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

    await this.#database.customer.update({
      data: { harvest_id: client.id },
      where: { id: data.id },
    });
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

  async projectsGet(params: { updated_since?: string } = {}) {
    type Data = { projects: HarvestProject[] };
    const data = await this.#fetch<Data>('GET', '/projects', { params });
    return data.projects;
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
