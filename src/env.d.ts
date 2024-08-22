declare namespace NodeJS {
  interface ProcessEnv {
    HARVEST_ACCOUNT_ID: string;
    HARVEST_ENDPOINT: string;
    HARVEST_TOKEN: string;
    MONEYBIRD_ENDPOINT: string;
    MONEYBIRD_TOKEN: string;
    MONEYBIRD_WEBHOOK_TOKEN: string;
    NODE_ENV: 'development' | 'production';
    PORT?: string;
  }
}
