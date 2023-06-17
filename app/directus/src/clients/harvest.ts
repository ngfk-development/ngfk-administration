import axios from 'axios';

const client = axios.create({
  baseURL: process.env.HARVEST_ENDPOINT,
  headers: {
    'Authorization': `Bearer ${process.env.HARVEST_TOKEN}`,
    'Harvest-Account-Id': process.env.HARVEST_ACCOUNT_ID,
    'User-Agent': 'NGFK Administration',
  },
});

export const harvest = Object.assign(client, {});
