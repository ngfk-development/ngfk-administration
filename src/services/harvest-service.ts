import querystring from 'node:querystring';

import { Contact, Customer, Service } from '@prisma/client';

import { Database } from '~/types/database';
import { HarvestContact } from '~/types/harvest/harvest-contact';
import { HarvestClient } from '~/types/harvest/harvest-client';

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
      if (data.updated_origin !== Service.HARVEST) this.clientUpsert(data);
    });

    this.#database.customer.subscribe('delete', (data) => {
      this.clientDelete(data);
    });

    this.#database.contact.subscribe('upsert', (data) => {
      if (data.updated_origin !== Service.HARVEST) this.contactUpsert(data);
    });

    this.#database.contact.subscribe('delete', (data) => {
      this.contactDelete(data);
    });
  }

  async clientUpsert(data: Customer) {
    if (data.harvest_id) {
      await this.#fetch('PATCH', `/clients/${data.harvest_id!}`, {
        name: data.company_name,
        is_active: true,
        address: `${data.address}\n${data.zipcode} ${data.city}`,
        currency: 'EUR',
      });

      return;
    }

    const client = await this.#fetch<HarvestClient>('POST', '/clients', {
      name: data.company_name,
      is_active: true,
      address: `${data.address}\n${data.zipcode} ${data.city}`,
      currency: 'EUR',
    });

    await this.#database.customer.update({
      data: { harvest_id: client.id },
      where: { id: data.id },
    });
  }

  async clientDelete(data: Customer) {
    if (!data.harvest_id) return;
    await this.#fetch<HarvestClient>('DELETE', `/clients/${data.harvest_id}`);
  }

  async contactUpsert(data: Contact) {
    if (data.harvest_id) {
      await this.#fetch('PATCH', `/contacts/${data.harvest_id}`, {
        first_name: data.first_name,
        last_name: data.last_name,
        title: data.title,
        email: data.email,
        phone_mobile: data.phone,
      });

      return;
    }

    const customer = await this.#database.customer.findUnique({
      where: { id: data.customer_id },
    });

    if (!customer?.harvest_id) return;

    const contact = await this.#fetch<HarvestContact>('POST', '/contacts', {
      client_id: customer.harvest_id,
      first_name: data.first_name,
      last_name: data.last_name,
      title: data.title,
      email: data.email,
      phone_mobile: data.phone,
    });

    await this.#database.contact.update({
      data: { harvest_id: contact.id },
      where: { id: data.id },
    });
  }

  async contactDelete(data: Contact) {
    if (!data.harvest_id) return;
    await this.#fetch('DELETE', `/contacts/${data.harvest_id}`);
  }

  async #fetch<T = unknown>(
    method: string,
    path: string,
    params: querystring.ParsedUrlQueryInput = {},
  ): Promise<T> {
    const query = querystring.stringify(params);

    const response = await fetch(`${this.#endpoint}${path}?${query}`, {
      method: method,
      headers: {
        'Authorization': `Bearer ${this.#token}`,
        'Harvest-Account-Id': this.#accountId,
      },
    });

    return response.json();
  }
}
