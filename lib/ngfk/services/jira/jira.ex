defmodule Ngfk.Services.Jira do
  @moduledoc false
  use Ngfk, :sync

  import Ecto.Query

  alias Ngfk.Projects.Project
  alias Ngfk.Projects.ProjectEpic
  alias Ngfk.Projects.ProjectEpicSearch
  alias Ngfk.Projects.ProjectSearch
  alias Ngfk.Services.Jira.JiraApi
  alias Ngfk.Users.User
  alias Ngfk.Users.UserSearch

  def sync_project_epics(opts \\ []) do
    [
      key: :code,
      changeset: &ProjectEpic.jira_changeset/2,
      search: &ProjectEpicSearch.search/1
    ]
    |> Keyword.merge(opts)
    |> Sync.new()
    |> Sync.action_read(&project_epics_read/0)
    |> Sync.execute()
  end

  def sync_projects(opts \\ []) do
    [
      key: :code,
      changeset: &Project.jira_changeset/2,
      search: &ProjectSearch.search/1,
      search_args_update: [jira_id: :not_empty, query: &where(&1, [p], p.jira_sync_at < p.harvest_sync_at)]
    ]
    |> Keyword.merge(opts)
    |> Sync.new()
    |> Sync.action_read(&projects_read/0)
    |> Sync.action_update(&JiraApi.projects_put/1)
    |> Sync.execute()
  end

  def sync_users(opts \\ []) do
    [
      key: :email,
      changeset: &User.jira_changeset/2,
      search: &UserSearch.search/1
    ]
    |> Keyword.merge(opts)
    |> Sync.new()
    |> Sync.action_read(&JiraApi.users_search_get/0)
    |> Sync.execute()
  end

  defp project_epics_read do
    with {:ok, epics} <- JiraApi.epics_get(updated_since: get_sync_date(ProjectEpic)),
         {:ok, projects} <- ProjectSearch.search(code: epics |> Enum.map(& &1.project.code) |> Enum.uniq()) do
      project_map = Map.new(projects, &{&1.code, &1})

      epics
      |> Enum.reduce([], fn epic, acc ->
        project = Map.get(project_map, epic.project.code)
        acc ++ [{epic, project}]
      end)
      |> Enum.map(fn
        {epic, nil} -> epic
        {epic, project} -> epic |> Map.put(:project_id, project.id) |> put_in([:project, :id], project.id)
      end)
      |> then(&{:ok, &1})
    end
  end

  defp projects_read do
    with {:ok, projects} <- ProjectSearch.search(code: :not_empty) do
      JiraApi.projects_get(keys: Enum.map(projects, & &1.code))
    end
  end

  defp get_sync_date(module) do
    module
    |> where([u], not is_nil(u.jira_sync_at))
    |> select([u], max(u.jira_sync_at))
    |> Repo.one()
  end
end
