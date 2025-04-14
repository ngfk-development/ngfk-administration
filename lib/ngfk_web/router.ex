defmodule NgfkWeb.Router do
  use NgfkWeb, :router

  alias NgfkWeb.Plugs.SharedSecret

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :shared_secret do
    plug SharedSecret
  end

  scope "/api", NgfkWeb do
    pipe_through [:api, :shared_secret]

    scope "/harvest" do
      post "/timer", HarvestController, :timer
    end

    scope "/jira" do
      post "/hook", JiraController, :hook
    end

    scope "/moneybird" do
      post "/hook", MoneybirdController, :hook
    end

    scope "/sync" do
      post "/all", SyncController, :all
    end
  end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:ngfk, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      live_dashboard "/dashboard", metrics: NgfkWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
