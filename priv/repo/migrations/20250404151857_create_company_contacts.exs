defmodule Ngfk.Repo.Migrations.CreateContacts do
  use Ecto.Migration

  def change do
    create table(:company_contacts, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :company_id,
          references(:companies, on_delete: :delete_all, on_update: :update_all, type: :binary_id),
          null: false

      add :harvest_id, :integer
      add :moneybird_id, :string, null: false
      add :moneybird_version, :integer, null: false
      add :first_name, :string, null: false
      add :last_name, :string, null: false
      add :phone, :string, null: false
      add :email, :string, null: false
      add :title, :string, null: false
      add :harvest_sync_at, :utc_datetime
      add :moneybird_sync_at, :utc_datetime, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:company_contacts, [:harvest_id])
    create unique_index(:company_contacts, [:moneybird_id])
    create index(:company_contacts, [:company_id])
    create index(:company_contacts, [:moneybird_version])
    create index(:company_contacts, [:first_name, :last_name])
    create index(:company_contacts, [:email])
    create index(:company_contacts, [:harvest_sync_at])
    create index(:company_contacts, [:moneybird_sync_at])
  end
end
