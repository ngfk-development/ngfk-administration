defmodule Ngfk.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :harvest_id, :integer
      add :jira_id, :string
      add :moneybird_id, :string
      add :email, :string, null: false
      add :harvest_sync_at, :utc_datetime
      add :jira_sync_at, :utc_datetime
      add :moneybird_sync_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:users, [:harvest_id])
    create unique_index(:users, [:jira_id])
    create unique_index(:users, [:moneybird_id])
    create unique_index(:users, [:email])
    create index(:users, [:harvest_sync_at])
    create index(:users, [:jira_sync_at])
    create index(:users, [:moneybird_sync_at])
  end
end
