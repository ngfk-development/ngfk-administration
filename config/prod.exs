import Config

config :logger, level: :info

config :ngfk, Ngfk.Scheduler,
  jobs: [
    {"0 2 * * *", {Ngfk.Services.Synchronize, :sync, []}}
  ]

config :swoosh, api_client: Swoosh.ApiClient.Finch, finch_name: Ngfk.Finch
config :swoosh, local: false
