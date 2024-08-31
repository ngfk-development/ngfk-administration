declare namespace NodeJS {
  interface ProcessEnv {
    HARVEST_ACCOUNT_ID: string;
    HARVEST_ENDPOINT: string;
    HARVEST_TOKEN: string;
    HARVEST_START_TIMER_SECRET: string;
    JIRA_ENDPOINT: string;
    JIRA_LEAD_ACCOUNT_ID: string;
    JIRA_TOKEN: string;
    JIRA_USERNAME: string;
    MONEYBIRD_CUSTOM_FIELD_HARVEST_ID: string;
    MONEYBIRD_ENDPOINT: string;
    MONEYBIRD_TOKEN: string;
    MONEYBIRD_WEBHOOK_TOKEN: string;
    NODE_ENV: 'development' | 'production';
    PORT?: string;
  }
}
