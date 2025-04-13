defmodule Ngfk.Repo.Migrations.CreateTimeEntries do
  use Ecto.Migration

  def change do
    create table(:time_entries, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :user_id,
          references(:users,
            on_delete: :delete_all,
            on_update: :update_all,
            type: :binary_id
          ),
          null: false

      add :project_id,
          references(:projects,
            on_delete: :delete_all,
            on_update: :update_all,
            type: :binary_id
          )

      add :epic_id,
          references(:project_epics,
            on_delete: :delete_all,
            on_update: :update_all,
            type: :binary_id
          )

      add :harvest_id, :bigint, null: false
      add :moneybird_id, :string
      add :description, :string, default: "-", null: false
      add :time_started, :timestamptz, null: false
      add :time_ended, :timestamptz
      add :hash, :string, null: false
      add :harvest_sync_at, :utc_datetime, null: false
      add :moneybird_sync_at, :utc_datetime

      timestamps()
    end

    create unique_index(:time_entries, [:harvest_id])
    create unique_index(:time_entries, [:moneybird_id])
    create unique_index(:time_entries, [:hash])
    create index(:time_entries, [:user_id])
    create index(:time_entries, [:project_id])
    create index(:time_entries, [:epic_id])
    create index(:time_entries, [:time_started])
    create index(:time_entries, [:time_ended])
    create index(:time_entries, [:harvest_sync_at])
    create index(:time_entries, [:moneybird_sync_at])
  end
end
