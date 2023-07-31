import axios from 'axios';

import { MoneybirdCustomField } from '../types/moneybird/moneybird-custom-field';

let lastInvocationTime = 0;
const requestThrottle = 2000;

const client = axios.create({
  baseURL: process.env.MONEYBIRD_ENDPOINT,
  headers: {
    Authorization: `Bearer ${process.env.MONEYBIRD_TOKEN}`,
  },
});

client.interceptors.request.use((config) => {
  const now = Date.now();

  lastInvocationTime += requestThrottle;
  const wait = lastInvocationTime - now;
  if (wait > 0)
    return new Promise((res) => setTimeout(() => res(config), wait));

  lastInvocationTime = now;
  return config;
});

function directusField(entity: { custom_fields: MoneybirdCustomField[] }) {
  return entity.custom_fields.find(
    (field) => field.id === process.env.MONEYBIRD_FIELD_DIRECTUS,
  );
}

function harvestField(entity: { custom_fields: MoneybirdCustomField[] }) {
  return entity.custom_fields.find(
    (field) => field.id === process.env.MONEYBIRD_FIELD_HARVEST,
  );
}

export const moneybird = Object.assign(client, { directusField, harvestField });
