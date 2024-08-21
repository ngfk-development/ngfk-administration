declare namespace NodeJS {
  interface ProcessEnv {
    MONEYBIRD_ENDPOINT: string;
    MONEYBIRD_TOKEN: string;
    MONEYBIRD_WEBHOOK_TOKEN: string;
    NODE_ENV: 'development' | 'production';
    PORT?: string;
  }
}
