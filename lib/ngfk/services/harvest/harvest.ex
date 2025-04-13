defmodule Ngfk.Services.Harvest do
  @moduledoc false
  use Ngfk, :sync

  import Ecto.Query

  alias Ngfk.Companies.Company
  alias Ngfk.Companies.CompanyContact
  alias Ngfk.Companies.CompanyContactSearch
  alias Ngfk.Companies.CompanySearch
  alias Ngfk.Projects.Project
  alias Ngfk.Projects.ProjectEpic
  alias Ngfk.Projects.ProjectEpicSearch
  alias Ngfk.Projects.ProjectSearch
  alias Ngfk.Services.Harvest.HarvestApi
  alias Ngfk.TimeEntries.TimeEntry
  alias Ngfk.TimeEntries.TimeEntrySearch
  alias Ngfk.Users.User
  alias Ngfk.Users.UserSearch

  def start_timer(%{user: user, project: project, epic: epic, issue: %{jira_id: _, code: _, title: _} = issue}) do
    with {:ok, [%User{} = user]} <- UserSearch.search(user),
         {:ok, [%Project{} = project]} <- ProjectSearch.search(project),
         {:ok, [%ProjectEpic{} = epic]} <- ProjectEpicSearch.search(epic) do
      start_timer(user, project, epic, issue)
    end
  end

  def start_timer(%User{} = user, %Project{} = project, %ProjectEpic{} = epic, %{jira_id: _, code: _, title: _} = issue) do
    HarvestApi.time_entries_post(user, project, epic, issue)
  end

  def sync_companies(opts \\ []) do
    [
      key: :customer_number,
      changeset: &Company.harvest_changeset/2,
      search: &CompanySearch.search/1,
      search_args: [preload: :contacts],
      search_args_create: [harvest_id: :empty],
      search_args_update: [harvest_id: :not_empty, query: &where(&1, [c], c.harvest_sync_at < c.moneybird_sync_at)]
    ]
    |> Keyword.merge(opts)
    |> Sync.new()
    |> Sync.action_create(&HarvestApi.clients_post/1)
    |> Sync.action_read(fn -> HarvestApi.clients_get(updated_since: get_sync_date(Company)) end)
    |> Sync.action_update(&HarvestApi.clients_patch/1)
    |> Sync.execute()
  end

  def sync_company_contacts(opts \\ []) do
    [
      key: :email,
      changeset: &CompanyContact.harvest_changeset/2,
      search: &CompanyContactSearch.search/1,
      search_args: [preload: :company],
      search_args_create: [harvest_id: :empty],
      search_args_update: [harvest_id: :not_empty, query: &where(&1, [c], c.harvest_sync_at < c.moneybird_sync_at)]
    ]
    |> Keyword.merge(opts)
    |> Sync.new()
    |> Sync.action_create(&HarvestApi.contacts_post/1)
    |> Sync.action_read(fn -> HarvestApi.contacts_get(updated_since: get_sync_date(CompanyContact)) end)
    |> Sync.action_update(&HarvestApi.contacts_patch/1)
    |> Sync.execute()
  end

  def sync_projects(opts \\ []) do
    [
      key: :harvest_id,
      changeset: &Project.harvest_changeset/2,
      search: &ProjectSearch.search/1
    ]
    |> Keyword.merge(opts)
    |> Sync.new()
    |> Sync.action_read(&projects_read/0)
    |> Sync.execute()
  end

  def sync_project_epics(opts \\ []) do
    [
      key: :code,
      changeset: &ProjectEpic.harvest_changeset/2,
      search: &ProjectEpicSearch.search/1,
      search_args_create: [harvest_id: :empty],
      search_args_update: [harvest_id: :not_empty, query: &where(&1, [c], c.harvest_sync_at < c.jira_sync_at)]
    ]
    |> Keyword.merge(opts)
    |> Sync.new()
    |> Sync.action_create(&HarvestApi.tasks_post/1)
    |> Sync.action_read(fn -> HarvestApi.tasks_get(updated_since: get_sync_date(ProjectEpic)) end)
    |> Sync.action_update(&HarvestApi.tasks_patch/1)
    |> Sync.execute()
  end

  def sync_project_epic_assignment(opts \\ []) do
    [
      key: :code,
      changeset: &ProjectEpic.harvest_assignment_changeset/2,
      search: &ProjectEpicSearch.search/1,
      search_args_create: [harvest_assignment_id: :empty, preload: :project]
    ]
    |> Keyword.merge(opts)
    |> Sync.new()
    |> Sync.action_create(&HarvestApi.task_assignments_post/1)
    |> Sync.action_read(fn -> HarvestApi.task_assignments_get(updated_since: get_assignment_sync_date(ProjectEpic)) end)
    |> Sync.execute()
  end

  def sync_time_entries(opts \\ []) do
    [
      key: :harvest_id,
      changeset: &TimeEntry.harvest_changeset/2,
      search: &TimeEntrySearch.search/1
    ]
    |> Keyword.merge(opts)
    |> Sync.new()
    |> Sync.action_read(&time_entries_read/0)
    |> Sync.execute()
  end

  def sync_users(opts \\ []) do
    [
      key: :email,
      changeset: &User.harvest_changeset/2,
      search: &UserSearch.search/1
    ]
    |> Keyword.merge(opts)
    |> Sync.new()
    |> Sync.action_read(&HarvestApi.users_get/0)
    |> Sync.execute()
  end

  defp projects_read do
    with {:ok, projects} <- HarvestApi.projects_get(updated_since: get_sync_date(Project)),
         {:ok, companies} <- CompanySearch.search(harvest_id: get_harvest_ids(projects, [:company])) do
      company_map = Map.new(companies, &{&1.harvest_id, &1})

      projects
      |> Enum.reduce([], fn project, acc ->
        company = Map.get(company_map, get_in(project.company.harvest_id))
        acc ++ [{project, company}]
      end)
      |> Enum.map(fn
        {project, nil} -> project
        {project, company} -> project |> Map.put(:company_id, company.id) |> put_in([:company, :id], company.id)
      end)
      |> then(&{:ok, &1})
    end
  end

  defp time_entries_read do
    with {:ok, entries} <- HarvestApi.time_entries_get(updated_since: get_sync_date(TimeEntry)),
         {:ok, users} <- UserSearch.search(harvest_id: get_harvest_ids(entries, [:user])),
         {:ok, projects} <- ProjectSearch.search(harvest_id: get_harvest_ids(entries, [:project])),
         {:ok, epics} <- ProjectEpicSearch.search(harvest_id: get_harvest_ids(entries, [:epic])) do
      user_map = Map.new(users, &{&1.harvest_id, &1})
      project_map = Map.new(projects, &{&1.harvest_id, &1})
      epic_map = Map.new(epics, &{&1.harvest_id, &1})

      entries
      |> Enum.reduce([], fn entry, acc ->
        user = Map.get(user_map, get_in(entry.user.harvest_id))
        project = Map.get(project_map, get_in(entry.project.harvest_id))
        epic = Map.get(epic_map, get_in(entry.epic.harvest_id))

        acc ++ [{entry, user, project, epic}]
      end)
      |> Enum.map(fn {entry, user, project, epic} ->
        epic_id = Map.get(epic || %{}, :id, nil)

        entry
        |> Map.put(:user_id, user.id)
        |> put_in([:user, :id], user.id)
        |> Map.put(:project_id, project.id)
        |> put_in([:project, :id], project.id)
        |> Map.put(:epic_id, epic_id)
        |> put_in([:epic, :id], epic_id)
      end)
      |> then(&{:ok, &1})
    end
  end

  defp get_harvest_ids(enumerable, path) do
    enumerable |> Enum.map(&get_in(&1, path ++ [:harvest_id])) |> Enum.reject(&is_nil/1) |> Enum.uniq()
  end

  defp get_assignment_sync_date(module) do
    module
    |> where([u], not is_nil(u.harvest_assignment_sync_at))
    |> select([u], max(u.harvest_assignment_sync_at))
    |> Repo.one()
  end

  defp get_sync_date(module) do
    module
    |> where([u], not is_nil(u.harvest_sync_at))
    |> select([u], max(u.harvest_sync_at))
    |> Repo.one()
  end
end
