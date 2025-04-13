defmodule Ngfk.Companies.CompanyContact do
  @moduledoc false
  use Ngfk, :schema

  alias Ngfk.Companies.Company

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "company_contacts" do
    field :company_id, :binary_id
    field :harvest_id, :integer
    field :moneybird_id, :string
    field :moneybird_version, :integer
    field :first_name, :string, default: ""
    field :last_name, :string, default: ""
    field :phone, :string, default: ""
    field :email, :string, default: ""
    field :title, :string, default: ""
    field :harvest_sync_at, :utc_datetime
    field :moneybird_sync_at, :utc_datetime

    has_one :company, Company,
      foreign_key: :id,
      references: :company_id,
      on_replace: :delete

    timestamps(type: :utc_datetime)
  end

  def harvest_changeset(contact, attrs) do
    contact = contact || %__MODULE__{}

    contact
    |> cast(attrs, [:harvest_id])
    |> validate_required([:harvest_id])
    |> put_change(:harvest_sync_at, sync_now())
    |> unique_constraint(:harvest_id)
  end

  def moneybird_changeset(contact, attrs) do
    contact = contact || %__MODULE__{}

    contact
    |> cast(attrs, [
      :moneybird_id,
      :moneybird_version,
      :first_name,
      :last_name,
      :phone,
      :email,
      :title
    ])
    |> validate_required([
      :moneybird_id,
      :moneybird_version,
      :email
    ])
    |> put_change(:moneybird_sync_at, sync_now())
    |> unique_constraint(:moneybird_id)
    |> ignore_invalid()
  end

  defp ignore_invalid(%Changeset{valid?: false} = changeset), do: %{changeset | action: :ignore}
  defp ignore_invalid(%Changeset{} = changeset), do: changeset
end
