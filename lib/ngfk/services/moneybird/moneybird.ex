defmodule Ngfk.Services.Moneybird do
  @moduledoc false
  use Ngfk, :sync

  import Ecto.Query

  alias Ngfk.Companies.Company
  alias Ngfk.Companies.CompanyContact
  alias Ngfk.Companies.CompanyContactSearch
  alias Ngfk.Companies.CompanySearch
  alias Ngfk.Projects.Project
  alias Ngfk.Projects.ProjectSearch
  alias Ngfk.Services.Moneybird.MoneybirdApi
  alias Ngfk.TimeEntries.TimeEntry
  alias Ngfk.TimeEntries.TimeEntrySearch
  alias Ngfk.Users.User
  alias Ngfk.Users.UserSearch

  def sync_companies do
    [
      key: :moneybird_id,
      changeset: &Company.moneybird_changeset/2,
      search: &CompanySearch.search/1,
      search_args: [preload: :contacts]
    ]
    |> Sync.new()
    |> Sync.action_read(fn -> MoneybirdApi.contacts_filter_get(updated_after: get_sync_date(Company)) end)
    |> Sync.execute()
  end

  def sync_company_contacts do
    [
      key: :moneybird_id,
      changeset: &CompanyContact.moneybird_changeset/2,
      search: &CompanyContactSearch.search/1
    ]
    |> Sync.new()
    |> Sync.action_read(&company_contacts_read/0)
    |> Sync.execute()
  end

  def sync_projects do
    [
      key: :code,
      changeset: &Project.moneybird_changeset/2,
      search: &ProjectSearch.search/1,
      search_args_create: [
        moneybird_id: :empty,
        query: &where(&1, [p], not is_nil(p.code))
      ],
      search_args_update: [
        moneybird_id: :not_empty,
        query: &where(&1, [p], not is_nil(p.code) and p.moneybird_sync_at < p.harvest_sync_at)
      ]
    ]
    |> Sync.new()
    |> Sync.action_create(&MoneybirdApi.projects_post/1)
    |> Sync.action_read(&MoneybirdApi.projects_get/0)
    |> Sync.action_update(&MoneybirdApi.projects_patch/1)
    |> Sync.execute()
  end

  def sync_time_entries do
    [
      key: :hash,
      changeset: &TimeEntry.moneybird_changeset/2,
      search: &TimeEntrySearch.search/1,
      search_args_create: [
        moneybird_id: :empty,
        preload: [:user, [project: :company]],
        query: &where(&1, [e], not is_nil(e.time_ended))
      ],
      search_args_update: [
        moneybird_id: :not_empty,
        preload: [project: :company],
        query: &where(&1, [e], e.moneybird_sync_at < e.harvest_sync_at)
      ]
    ]
    |> Sync.new()
    |> Sync.action_create(&time_entries_create/1)
    |> Sync.action_read(&time_entries_read/0)
    |> Sync.action_update(&MoneybirdApi.time_entries_patch/1, key: :moneybird_id)
    |> Sync.execute()
  end

  def sync_users do
    [
      key: :email,
      changeset: &User.moneybird_changeset/2,
      search: &UserSearch.search/1
    ]
    |> Sync.new()
    |> Sync.action_read(&MoneybirdApi.users_get/0)
    |> Sync.execute()
  end

  defp company_contacts_read do
    with {:ok, contacts} <- CompanyContactSearch.search(moneybird_id: :not_empty, preload: :company) do
      MoneybirdApi.contact_people_get(contacts)
    end
  end

  defp time_entries_create(%TimeEntry{} = entry) do
    with {:ok, data} <- MoneybirdApi.time_entries_post(entry) do
      {:ok, Map.put(data, :hash, entry.hash)}
    end
  end

  defp time_entries_read do
    with {:ok, entries} <- MoneybirdApi.time_entries_get(updated_since: get_sync_date(TimeEntry)),
         {:ok, existing} <- TimeEntrySearch.search(moneybird_id: Enum.map(entries, & &1.moneybird_id)),
         {:ok, users} <- UserSearch.search(moneybird_id: Enum.map(entries, &get_in(&1, [:user, :moneybird_id]))),
         {:ok, projects} <- ProjectSearch.search(moneybird_id: Enum.map(entries, &get_in(&1, [:project, :moneybird_id]))) do
      existing_map = Map.new(existing, &{&1.moneybird_id, &1})
      user_map = Map.new(users, &{&1.moneybird_id, &1})
      project_map = Map.new(projects, &{&1.moneybird_id, &1})

      entries
      |> Enum.reject(&Map.has_key?(existing_map, &1.moneybird_id))
      |> Enum.reduce([], fn entry, acc ->
        user = Map.get(user_map, get_in(entry.user.moneybird_id))
        project = Map.get(project_map, get_in(entry.project.moneybird_id))

        acc ++ [{entry, user, project}]
      end)
      |> Enum.map(fn {entry, user, project} ->
        entry
        |> Map.put(:user_id, user.id)
        |> put_in([:user, :id], user.id)
        |> put_in([:user, :harvest_id], user.harvest_id)
        |> Map.put(:project_id, project.id)
        |> put_in([:project, :id], project.id)
        |> put_in([:project, :harvest_id], project.harvest_id)
      end)
      |> Enum.map(&Map.put(&1, :hash, TimeEntry.hash(&1)))
      |> then(&{:ok, &1})
    end
  end

  defp get_sync_date(module) do
    module
    |> where([u], not is_nil(u.moneybird_sync_at))
    |> select([u], max(u.moneybird_sync_at))
    |> Repo.one()
  end
end
