defmodule NgfkWeb.HarvestController do
  @moduledoc false
  use NgfkWeb, :controller

  alias Ngfk.Services.Harvest

  def timer(conn, %{"issue" => issue, "user" => user}) do
    user = [email: Map.get(user, "emailAddress")]
    project = [jira_id: issue |> get_in(["fields", "project", "id"]) |> to_string()]
    epic = [jira_id: get_in(issue, ["fields", "parent", "id"])]
    issue = %{jira_id: Map.get(issue, "id"), code: Map.get(issue, "key"), title: get_in(issue, ["fields", "summary"])}

    with {:has_epic, true} <- {:has_epic, is_binary(Keyword.get(epic, :jira_id))},
         {:ok, _} <- Harvest.start_timer(%{user: user, project: project, epic: epic, issue: issue}) do
      conn
      |> put_status(200)
      |> json(%{message: "Timer started"})
    else
      {:has_epic, false} ->
        conn
        |> put_status(400)
        |> json(%{error: "HARVEST_TIMER_EPIC_MISSING", message: "Failed to start timer - Issue needs an epic"})
    end
  end
end
