import { Database } from '~/types/database';
import { MoneybirdContact } from '~/types/moneybird/moneybird-contact';
import { MoneybirdEvent } from '~/types/moneybird/moneybird-event';

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

  async synchronize() {
    // MoneybirdContact - Customer
    const contacts = await this.listContacts();
    await this.#database.$transaction(
      contacts.map((contact) =>
        this.#database.customer.moneybirdUpsert(contact),
      ),
    );

    // MoneybirdContactPerson - Contact
    const contactPeople = contacts.flatMap((contact) => contact.contact_people);
    await this.#database.$transaction(
      contactPeople.map((person) =>
        this.#database.contact.moneybirdUpsert(person),
      ),
    );
  }

  listContacts() {
    return this.#fetch<MoneybirdContact[]>('GET', '/contacts');
  }

  async #fetch<T = unknown>(method: string, path: string): Promise<T> {
    const response = await fetch(`${this.#endpoint}${path}`, {
      method: method,
      headers: { Authorization: `Bearer ${this.#token}` },
    });

    return response.json();
  }
}
