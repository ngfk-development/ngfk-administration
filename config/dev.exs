import Config

config :logger, :console, format: "[$level] $message\n"

config :ngfk, Ngfk.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "ngfk_administration",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10,
  log: false

config :ngfk, NgfkWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "krVJhQxKDzOKtZC1LkJBBMcGOC5q0fYcacXoo6RwlA0/W4FqhyEdyRpBmjAWKUjU",
  watchers: []

config :ngfk, :harvest,
  endpoint: System.get_env("HARVEST_ENDPOINT"),
  token: System.get_env("HARVEST_TOKEN"),
  account_id: System.get_env("HARVEST_ACCOUNT_ID")

config :ngfk, :jira,
  endpoint: System.get_env("JIRA_ENDPOINT"),
  token: System.get_env("JIRA_TOKEN"),
  username: System.get_env("JIRA_USERNAME")

config :ngfk, :moneybird,
  endpoint: System.get_env("MONEYBIRD_ENDPOINT"),
  token: System.get_env("MONEYBIRD_TOKEN")

config :ngfk, dev_routes: true

config :phoenix, :plug_init_mode, :runtime
config :phoenix, :stacktrace_depth, 20

config :swoosh, :api_client, false
