import { Prisma, PrismaClient } from '@prisma/client';

import { MoneybirdContact } from '~/types/moneybird/moneybird-contact';
import { MoneybirdContactPerson } from '~/types/moneybird/moneybird-contact-person';
import { MoneybirdEvent } from '~/types/moneybird/moneybird-event';

export interface MoneybirdServiceOptions {
  database: PrismaClient;
  endpoint: string;
  token: string;
  webhookToken: string;
}

export class MoneybirdService {
  #database: PrismaClient;
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
        return this.#upsertCustomer(event.entity);
      case 'contact_destroyed':
        return this.#deleteCustomer(event.entity);

      case 'contact_person_created':
      case 'contact_person_updated':
        return this.#upsertContact(event.entity);
      case 'contact_person_destroyed':
        return this.#deleteContact(event.entity);

      default:
        return null;
    }
  }

  #deleteContact(contact: MoneybirdContactPerson) {
    return this.#database.contact.delete({
      where: { moneybird_id: contact.id },
    });
  }

  #deleteCustomer(contact: MoneybirdContact) {
    return this.#database.customer.delete({
      where: { moneybird_id: contact.id },
    });
  }

  #upsertContact(person: MoneybirdContactPerson) {
    const data: Prisma.ContactCreateInput = {
      moneybird_id: person.id,
      moneybird_version: person.version,

      first_name: person.firstname,
      last_name: person.lastname,
      phone: person.phone,
      email: person.email,
      title: person.department,

      customer: { connect: { moneybird_id: person.contact_id } },
    };

    return this.#database.contact.upsert({
      where: { moneybird_id: person.id },
      create: data,
      update: data,
    });
  }

  #upsertCustomer(contact: MoneybirdContact) {
    const data: Prisma.CustomerCreateInput = {
      moneybird_id: contact.id,
      moneybird_version: contact.version,
      moneybird_customer_number: contact.customer_id,

      company_name: contact.company_name,
      address: contact.address1,
      zipcode: contact.zipcode,
      city: contact.city,
      country: contact.country,

      chamber_of_commerce_number: contact.chamber_of_commerce,
      tax_number: contact.tax_number,
    };

    return this.#database.customer.upsert({
      where: { moneybird_id: contact.id },
      create: data,
      update: data,
    });
  }

  async #fetch<T = unknown>(method: string, path: string): Promise<T> {
    const response = await fetch(`${this.#endpoint}${path}`, {
      method: method,
      headers: { Authorization: `Bearer ${this.#token}` },
    });

    return response.json();
  }
}
