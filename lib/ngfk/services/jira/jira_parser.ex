defmodule Ngfk.Services.Jira.JiraParser do
  @moduledoc false

  def parse_epic(epic) do
    [code, project_code] = Regex.run(~r/^(.*)-.*$/, Map.get(epic, "key"))

    %{
      project: %{code: project_code},
      jira_id: Map.get(epic, "id"),
      code: code,
      title: get_in(epic, ["fields", "summary"]),
      status: get_in(epic, ["fields", "status", "name"]),
      archived: get_in(epic, ["fields", "status", "statusCategory", "name"]) == "Done"
    }
  end

  def parse_project(project) do
    %{
      jira_id: Map.get(project, "id"),
      name: Map.get(project, "name"),
      code: Map.get(project, "key")
    }
  end

  def parse_user(user) do
    %{
      jira_id: Map.get(user, "accountId"),
      email: Map.get(user, "emailAddress")
    }
  end
end
