defmodule Ngfk.Users.User do
  @moduledoc false
  use Ngfk, :schema

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "users" do
    field :harvest_id, :integer
    field :jira_id, :string
    field :moneybird_id, :string
    field :email, :string
    field :harvest_sync_at, :utc_datetime
    field :jira_sync_at, :utc_datetime
    field :moneybird_sync_at, :utc_datetime

    timestamps(type: :utc_datetime)
  end

  def harvest_changeset(user, attrs) do
    user = user || %__MODULE__{}

    user
    |> cast(attrs, [
      :harvest_id,
      :email
    ])
    |> validate_required([
      :harvest_id,
      :email
    ])
    |> put_change(:harvest_sync_at, sync_now())
    |> unique_constraint(:email)
    |> unique_constraint(:harvest_id)
  end

  def jira_changeset(user, attrs) do
    user = user || %__MODULE__{}

    user
    |> cast(attrs, [
      :jira_id,
      :email
    ])
    |> validate_required([
      :jira_id,
      :email
    ])
    |> put_change(:jira_sync_at, sync_now())
    |> unique_constraint(:email)
    |> unique_constraint(:jira_id)
  end

  def moneybird_changeset(user, attrs) do
    user = user || %__MODULE__{}

    user
    |> cast(attrs, [
      :moneybird_id,
      :email
    ])
    |> validate_required([
      :moneybird_id,
      :email
    ])
    |> put_change(:moneybird_sync_at, sync_now())
    |> unique_constraint(:email)
    |> unique_constraint(:moneybird_id)
  end
end
