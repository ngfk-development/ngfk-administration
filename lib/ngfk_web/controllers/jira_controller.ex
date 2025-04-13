defmodule NgfkWeb.JiraController do
  @moduledoc false
  use NgfkWeb, :controller

  alias Ngfk.Services.Synchronize

  @event_project_sync ["project_created", "project_updated"]
  @event_project_epic_sync ["jira:issue_created", "jira:issue_updated"]

  def hook(conn, %{"webhookEvent" => event}) do
    opts = [jira: [only: [:read, :update]]]

    case event do
      event when event in @event_project_sync -> Synchronize.sync_projects(opts)
      event when event in @event_project_epic_sync -> Synchronize.sync_project_epics(opts)
    end

    # Always returns a success status, if anything is wrong with the sync
    # process we don't want jira to retry the failed webhook.
    conn |> put_status(200) |> json(%{status: "ok"})
  end
end
