defmodule Ngfk.Repo.Migrations.CreateCompanies do
  use Ecto.Migration

  def change do
    create table(:companies, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :harvest_id, :integer
      add :moneybird_id, :string, null: false
      add :moneybird_version, :integer, null: false
      add :customer_number, :string, null: false
      add :name, :string, null: false
      add :address, :string, null: false
      add :zip_code, :string, null: false
      add :city, :string, null: false
      add :country, :string, null: false
      add :chamber_of_commerce_number, :string, null: false
      add :tax_number, :string, null: false
      add :harvest_sync_at, :utc_datetime
      add :moneybird_sync_at, :utc_datetime, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:companies, [:harvest_id])
    create unique_index(:companies, [:customer_number])
    create unique_index(:companies, [:moneybird_id])
    create unique_index(:companies, [:name])
    create index(:companies, [:harvest_sync_at])
    create index(:companies, [:moneybird_version])
    create index(:companies, [:moneybird_sync_at])
  end
end
