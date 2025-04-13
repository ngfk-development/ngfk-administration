import Config

config :logger, level: :info

config :swoosh, api_client: Swoosh.ApiClient.Finch, finch_name: Ngfk.Finch
config :swoosh, local: false
