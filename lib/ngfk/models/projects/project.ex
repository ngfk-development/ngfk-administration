defmodule Ngfk.Projects.Project do
  @moduledoc false
  use Ngfk, :schema

  alias Ngfk.Companies.Company
  alias Ngfk.Projects.ProjectEpic

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "projects" do
    field :company_id, :binary_id
    field :harvest_id, :integer
    field :jira_id, :string
    field :moneybird_id, :string
    field :name, :string, default: ""
    field :code, :string
    field :active, :boolean, default: true
    field :billable, :boolean, default: true
    field :hourly_rate, :integer, default: 0
    field :harvest_sync_at, :utc_datetime
    field :jira_sync_at, :utc_datetime
    field :moneybird_sync_at, :utc_datetime

    has_one :company, Company,
      foreign_key: :id,
      references: :company_id,
      on_replace: :delete

    has_many :epics, ProjectEpic,
      foreign_key: :project_id,
      on_delete: :delete_all,
      on_replace: :delete_if_exists

    timestamps(type: :utc_datetime)
  end

  def harvest_changeset(project, attrs) do
    project = project || %__MODULE__{}

    project
    |> cast(attrs, [
      :company_id,
      :harvest_id,
      :name,
      :code,
      :active,
      :billable,
      :hourly_rate
    ])
    |> validate_required([
      :harvest_id,
      :name
    ])
    |> put_change(:harvest_sync_at, sync_now())
    |> unique_constraint(:harvest_id)
  end

  def jira_changeset(project, attrs) do
    project = project || %__MODULE__{}

    project
    |> cast(attrs, [:jira_id])
    |> validate_required([:jira_id])
    |> put_change(:jira_sync_at, sync_now())
    |> unique_constraint(:jira_id)
  end

  def moneybird_changeset(project, attrs) do
    project = project || %__MODULE__{}

    project
    |> cast(attrs, [:moneybird_id])
    |> validate_required([:moneybird_id])
    |> put_change(:moneybird_sync_at, sync_now())
    |> unique_constraint(:moneybird_id)
  end
end
