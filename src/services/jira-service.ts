import querystring from 'node:querystring';

import { Project, Service } from '@prisma/client';

import { Database } from '~/types/database';
import { JiraPaginated } from '~/types/jira/jira-paginated';
import { JiraProject } from '~/types/jira/jira-project';

export interface JiraServiceOptions {
  database: Database;
  endpoint: string;
  leadAccountId: string;
  token: string;
  username: string;
}

export class JiraService {
  #database: Database;
  #endpoint: string;
  #leadAccountId: string;
  #token: string;
  #username: string;

  constructor(options: JiraServiceOptions) {
    this.#database = options.database;
    this.#endpoint = options.endpoint;
    this.#leadAccountId = options.leadAccountId;
    this.#token = options.token;
    this.#username = options.username;
  }

  async initializeSubscriptions() {
    this.#database.project.subscribe('upsert', (data) => {
      if (data.updated_origin === Service.JIRA) return;

      if (data.jira_id) this.projectPut(data);
      else this.projectPost(data);
    });

    this.#database.project.subscribe('delete', (data) => {
      this.projectDelete(data);
    });
  }

  async projectPost(data: Project) {
    if (data.jira_id) return;

    const project = await this.#fetch<{ id: number }>('POST', '/project', {
      data: {
        key: data.code,
        name: data.name,
        leadAccountId: this.#leadAccountId,
        projectTemplateKey:
          'com.pyxis.greenhopper.jira:gh-simplified-scrum-classic',
        projectTypeKey: 'software',
      },
    });

    await this.#database.project.jiraUpdate(data, project);
  }

  async projectPut(data: Project) {
    if (!data.jira_id) return;
    if (!data.code) return this.projectDelete(data);

    await this.#fetch('PUT', `/project/${data.jira_id}`, {
      data: { key: data.code, name: data.name },
    });
  }

  async projectDelete(data: Project) {
    if (!data.jira_id) return;

    await this.#fetch('DELETE', `/project/${data.jira_id}`, {
      params: { enableUndo: true },
    });
  }

  async *projectSearchGet({ maxResults = 50 } = {}) {
    yield* this.#iterate<JiraProject>('GET', '/project/search', {
      params: { maxResults },
    });
  }

  async *#iterate<T = unknown>(
    method: string,
    path: string,
    options: {
      data?: Record<string, any>;
      params: { maxResults: number } & querystring.ParsedUrlQueryInput;
    },
  ) {
    for (let i = 0; true; i += options.params.maxResults) {
      const page = await this.#fetch<JiraPaginated<T>>(method, path, {
        ...options,
        params: {
          ...options.params,
          startAt: i,
          maxResults: options.params.maxResults,
        },
      });

      yield* page.values;

      if (page.isLast) break;
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

    const credentials = `${this.#username}:${this.#token}`;
    const authentication = Buffer.from(credentials).toString('base64');

    const headers: HeadersInit = { Authorization: `Basic ${authentication}` };
    if (options.data) headers['Content-Type'] = 'application/json';

    const response = await fetch(`${this.#endpoint}${path}${query}`, {
      body: options.data ? JSON.stringify(options.data) : undefined,
      headers,
      method,
    });

    return response.json();
  }
}
