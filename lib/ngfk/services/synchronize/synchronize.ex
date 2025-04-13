defmodule Ngfk.Services.Synchronize do
  @moduledoc false
  alias Ngfk.Companies.Company
  alias Ngfk.Companies.CompanyContact
  alias Ngfk.Companies.CompanyContactSearch
  alias Ngfk.Companies.CompanySearch
  alias Ngfk.Repo
  alias Ngfk.Services.Harvest
  alias Ngfk.Services.Jira
  alias Ngfk.Services.Moneybird

  def cleanup_company(id) do
    with {:ok, [%Company{} = company]} <- CompanySearch.search(moneybird_id: id),
         {:ok, %Company{} = company} <- Harvest.cleanup_company(company) do
      Repo.delete(company)
    end
  end

  def cleanup_company_contact(id) do
    with {:ok, [%CompanyContact{} = contact]} <- CompanyContactSearch.search(moneybird_id: id),
         {:ok, %CompanyContact{} = contact} <- Harvest.cleanup_company_contact(contact) do
      Repo.delete(contact)
    end
  end

  def sync(opts \\ []) do
    with :ok <- sync_users(opts),
         :ok <- sync_companies(opts),
         :ok <- sync_company_contacts(opts),
         :ok <- sync_projects(opts),
         :ok <- sync_project_epics(opts) do
      sync_time_entries(opts)
    end
  end

  def sync_companies(opts \\ []) do
    opts = parse_opts(opts)

    with {:ok, _} <- Moneybird.sync_companies(opts.moneybird),
         {:ok, _} <- Harvest.sync_companies(opts.harvest) do
      :ok
    end
  end

  def sync_company_contacts(opts \\ []) do
    opts = parse_opts(opts)

    with {:ok, _} <- Moneybird.sync_company_contacts(opts.moneybird),
         {:ok, _} <- Harvest.sync_company_contacts(opts.harvest) do
      :ok
    end
  end

  def sync_project_epics(opts \\ []) do
    opts = parse_opts(opts)

    with {:ok, _} <- Jira.sync_project_epics(opts.jira),
         {:ok, _} <- Harvest.sync_project_epics(opts.harvest),
         {:ok, _} <- Harvest.sync_project_epic_assignment(opts.harvest) do
      :ok
    end
  end

  def sync_projects(opts \\ []) do
    opts = parse_opts(opts)

    with {:ok, _} <- Harvest.sync_projects(opts.harvest),
         {:ok, _} <- Moneybird.sync_projects(opts.moneybird),
         {:ok, _} <- Jira.sync_projects(opts.jira) do
      :ok
    end
  end

  def sync_time_entries(opts \\ []) do
    opts = parse_opts(opts)

    with {:ok, _} <- Harvest.sync_time_entries(opts.harvest),
         {:ok, _} <- Moneybird.sync_time_entries(opts.moneybird) do
      :ok
    end
  end

  def sync_users(opts \\ []) do
    opts = parse_opts(opts)

    with {:ok, _} <- Moneybird.sync_users(opts.moneybird),
         {:ok, _} <- Harvest.sync_users(opts.harvest),
         {:ok, _} <- Jira.sync_users(opts.jira) do
      :ok
    end
  end

  defp parse_opts(opts) do
    %{
      harvest: Keyword.get(opts, :harvest, []),
      jira: Keyword.get(opts, :jira, []),
      moneybird: Keyword.get(opts, :moneybird, [])
    }
  end
end
