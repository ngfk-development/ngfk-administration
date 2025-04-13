defmodule Ngfk.Projects.ProjectEpic do
  @moduledoc false
  use Ngfk, :schema

  alias Ngfk.Projects.Project

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "project_epics" do
    field :project_id, :binary_id
    field :harvest_id, :integer
    field :harvest_assignment_id, :integer
    field :jira_id, :string
    field :code, :string
    field :title, :string
    field :status, :string
    field :archived, :boolean, default: false
    field :harvest_sync_at, :utc_datetime
    field :harvest_assignment_sync_at, :utc_datetime
    field :jira_sync_at, :utc_datetime

    has_one :project, Project,
      foreign_key: :id,
      references: :project_id,
      on_replace: :delete

    timestamps(type: :utc_datetime)
  end

  def harvest_assignment_changeset(epic, attrs) do
    epic = epic || %__MODULE__{}

    epic
    |> cast(attrs, [:harvest_assignment_id])
    |> validate_required([:harvest_assignment_id])
    |> put_change(:harvest_assignment_sync_at, sync_now())
    |> unique_constraint(:harvest_assignment_id)
  end

  def harvest_changeset(epic, attrs) do
    epic = epic || %__MODULE__{}

    epic
    |> cast(attrs, [:harvest_id])
    |> validate_required([:harvest_id])
    |> put_change(:harvest_sync_at, sync_now())
    |> unique_constraint(:harvest_id)
  end

  def jira_changeset(epic, attrs) do
    epic = epic || %__MODULE__{}

    epic
    |> cast(attrs, [
      :project_id,
      :jira_id,
      :code,
      :title,
      :status,
      :archived
    ])
    |> validate_required([
      :project_id,
      :jira_id,
      :code,
      :title,
      :status,
      :archived
    ])
    |> put_change(:jira_sync_at, sync_now())
    |> unique_constraint(:jira_id)
    |> unique_constraint(:code)
  end
end
