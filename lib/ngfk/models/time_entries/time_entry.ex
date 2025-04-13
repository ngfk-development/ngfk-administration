defmodule Ngfk.TimeEntries.TimeEntry do
  @moduledoc false
  use Ngfk, :schema

  alias Ngfk.Projects.Project
  alias Ngfk.Projects.ProjectEpic
  alias Ngfk.Users.User

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "time_entries" do
    field :user_id, :binary_id
    field :project_id, :binary_id
    field :epic_id, :binary_id
    field :harvest_id, :integer
    field :moneybird_id, :string
    field :description, :string
    field :time_started, :utc_datetime
    field :time_ended, :utc_datetime
    field :hash, :string
    field :harvest_sync_at, :utc_datetime
    field :moneybird_sync_at, :utc_datetime

    has_one :user, User,
      foreign_key: :id,
      references: :user_id,
      on_replace: :delete

    has_one :project, Project,
      foreign_key: :id,
      references: :project_id,
      on_replace: :delete

    has_one :epic, ProjectEpic,
      foreign_key: :id,
      references: :epic_id,
      on_replace: :delete

    timestamps(type: :utc_datetime)
  end

  def hash(entry) do
    user_id = get_in(entry.user.harvest_id)
    project_id = get_in(entry.project.harvest_id)
    time_started = DateTime.to_unix(entry.time_started)
    time_ended = if entry.time_ended, do: DateTime.to_unix(entry.time_ended), else: 0

    key = Enum.join([user_id, project_id, time_started, time_ended], ";")
    :sha256 |> :crypto.hash(key) |> Base.encode64()
  end

  def harvest_changeset(entry, attrs) do
    entry = entry || %__MODULE__{}

    entry
    |> cast(attrs, [
      :user_id,
      :project_id,
      :epic_id,
      :harvest_id,
      :description,
      :time_started,
      :time_ended
    ])
    |> validate_required([
      :user_id,
      :project_id,
      :harvest_id,
      :time_started
    ])
    |> put_change(:hash, hash(attrs))
    |> put_change(:harvest_sync_at, sync_now())
    |> unique_constraint(:harvest_id)
  end

  def moneybird_changeset(entry, attrs) do
    entry = entry || %__MODULE__{}

    entry
    |> cast(attrs, [:moneybird_id, :hash])
    |> validate_required([:moneybird_id, :hash])
    |> put_change(:moneybird_sync_at, sync_now())
    |> unique_constraint(:moneybird_id)
  end
end
