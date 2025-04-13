import Config

config :logger, level: :info

config :ngfk, NgfkWeb.Endpoint, shared_secret: System.get_env("NGFK_SHARED_SECRET")

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

config :swoosh, api_client: Swoosh.ApiClient.Finch, finch_name: Ngfk.Finch
config :swoosh, local: false
