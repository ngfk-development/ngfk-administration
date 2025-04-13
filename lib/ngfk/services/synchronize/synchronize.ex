defmodule Ngfk.Services.Synchronize do
  @moduledoc false
  alias Ngfk.Services.Harvest
  alias Ngfk.Services.Jira
  alias Ngfk.Services.Moneybird

  require Logger

  def sync do
    with :ok <- sync_users(),
         :ok <- sync_companies(),
         :ok <- sync_company_contacts(),
         :ok <- sync_projects(),
         :ok <- sync_project_epics() do
      sync_time_entries()
    end
  end

  def sync_companies do
    with {:ok, _} <- Moneybird.sync_companies(),
         {:ok, _} <- Harvest.sync_companies() do
      :ok
    end
  end

  def sync_company_contacts do
    with {:ok, _} <- Moneybird.sync_company_contacts(),
         {:ok, _} <- Harvest.sync_company_contacts() do
      :ok
    end
  end

  def sync_project_epics do
    with {:ok, _} <- Jira.sync_project_epics(),
         {:ok, _} <- Harvest.sync_project_epics(),
         {:ok, _} <- Harvest.sync_project_epic_assignment() do
      :ok
    end
  end

  def sync_projects do
    with {:ok, _} <- Harvest.sync_projects(),
         {:ok, _} <- Moneybird.sync_projects(),
         {:ok, _} <- Jira.sync_projects() do
      :ok
    end
  end

  def sync_time_entries do
    with {:ok, _} <- Harvest.sync_time_entries(),
         {:ok, _} <- Moneybird.sync_time_entries() do
      :ok
    end
  end

  def sync_users do
    with {:ok, _} <- Moneybird.sync_users(),
         {:ok, _} <- Harvest.sync_users(),
         {:ok, _} <- Jira.sync_users() do
      :ok
    end
  end
end
