defmodule Ngfk.Companies.Company do
  @moduledoc false
  use Ngfk, :schema

  alias Ngfk.Companies.CompanyContact

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "companies" do
    field :harvest_id, :integer
    field :moneybird_id, :string
    field :moneybird_version, :integer
    field :customer_number, :string, default: ""
    field :name, :string, default: ""
    field :address, :string, default: ""
    field :zip_code, :string, default: ""
    field :city, :string, default: ""
    field :country, :string, default: ""
    field :chamber_of_commerce_number, :string, default: ""
    field :tax_number, :string, default: ""
    field :harvest_sync_at, :utc_datetime
    field :moneybird_sync_at, :utc_datetime

    has_many :contacts, CompanyContact,
      foreign_key: :company_id,
      on_delete: :delete_all,
      on_replace: :delete_if_exists

    timestamps(type: :utc_datetime)
  end

  def harvest_changeset(company, attrs) do
    company = company || %__MODULE__{}

    company
    |> cast(attrs, [:harvest_id])
    |> validate_required([:harvest_id])
    |> put_change(:harvest_sync_at, sync_now())
    |> unique_constraint(:harvest_id)
  end

  def moneybird_changeset(company, attrs) do
    company = company || %__MODULE__{}

    company
    |> cast(attrs, [
      :moneybird_id,
      :moneybird_version,
      :customer_number,
      :name,
      :address,
      :zip_code,
      :city,
      :country,
      :chamber_of_commerce_number,
      :tax_number
    ])
    |> validate_required([
      :moneybird_id,
      :moneybird_version,
      :customer_number,
      :name
    ])
    |> put_change(:moneybird_sync_at, sync_now())
    |> unique_constraint(:harvest_id)
    |> unique_constraint(:moneybird_id)
    |> cast_assoc(:contacts, with: &CompanyContact.moneybird_changeset/2)
  end
end
