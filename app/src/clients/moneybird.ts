import axios from 'axios';

import { MoneybirdCustomField } from '../types/moneybird/moneybird-custom-field';

const client = axios.create({
  baseURL: process.env.MONEYBIRD_ENDPOINT,
  headers: {
    Authorization: `Bearer ${process.env.MONEYBIRD_TOKEN}`,
  },
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
