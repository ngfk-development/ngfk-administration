defmodule NgfkWeb.JiraController do
  @moduledoc false
  use NgfkWeb, :controller

  alias Ngfk.Services.Synchronize

  @event_project_sync ["project_created", "project_updated"]
  @event_project_epic_sync ["jira:issue_created", "jira:issue_updated"]
  @event_project_epic_cleanup ["jira:issue_deleted"]

  def hook(conn, %{"webhookEvent" => event} = params) do
    opts = [jira: [only: [:read, :update]]]

    case event do
      event when event in @event_project_sync -> Synchronize.sync_projects(opts)
      event when event in @event_project_epic_sync -> Synchronize.sync_project_epics(opts)
      event when event in @event_project_epic_cleanup -> Synchronize.cleanup_project_epic(get_in(params, ["issue", "id"]))
    end

    # Always returns a success status, if anything is wrong with the sync
    # process we don't want jira to retry the failed webhook.
    conn |> put_status(200) |> json(%{message: "ok"})
  end
end
