defmodule Ngfk.Repo.Migrations.CreateProjects do
  use Ecto.Migration

  def change do
    create table(:projects, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :company_id,
          references(:companies, on_delete: :delete_all, on_update: :update_all, type: :binary_id),
          null: false

      add :harvest_id, :integer, null: false
      add :jira_id, :string
      add :moneybird_id, :string
      add :name, :string, default: "", null: false
      add :code, :string
      add :active, :boolean, default: true, null: false
      add :billable, :boolean, default: false, null: false
      add :hourly_rate, :integer, default: 0, null: false
      add :harvest_sync_at, :utc_datetime, null: false
      add :jira_sync_at, :utc_datetime
      add :moneybird_sync_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:projects, [:harvest_id])
    create unique_index(:projects, [:jira_id])
    create unique_index(:projects, [:moneybird_id])
    create unique_index(:projects, [:code])
    create index(:projects, [:company_id])
    create index(:projects, [:harvest_sync_at])
    create index(:projects, [:jira_sync_at])
    create index(:projects, [:moneybird_sync_at])
  end
end
