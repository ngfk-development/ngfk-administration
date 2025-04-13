defmodule Ngfk.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      NgfkWeb.Telemetry,
      Ngfk.Repo,
      {DNSCluster, query: Application.get_env(:ngfk, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Ngfk.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: Ngfk.Finch},
      # Start a worker by calling: Ngfk.Worker.start_link(arg)
      # {Ngfk.Worker, arg},
      # Start to serve requests, typically the last entry
      NgfkWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Ngfk.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    NgfkWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
