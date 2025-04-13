defmodule Ngfk.Repo.Migrations.CreateProjectEpics do
  use Ecto.Migration

  def change do
    create table(:project_epics, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :project_id,
          references(:projects, on_delete: :delete_all, on_update: :update_all, type: :binary_id),
          null: false

      add :harvest_id, :integer
      add :harvest_assignment_id, :integer
      add :jira_id, :string, null: false
      add :code, :string, null: false
      add :title, :string, null: false
      add :status, :string, null: false
      add :archived, :boolean, default: false, null: false
      add :harvest_sync_at, :utc_datetime
      add :harvest_assignment_sync_at, :utc_datetime
      add :jira_sync_at, :utc_datetime, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:project_epics, [:harvest_id])
    create unique_index(:project_epics, [:harvest_assignment_id])
    create unique_index(:project_epics, [:jira_id])
    create unique_index(:project_epics, [:code])
    create index(:project_epics, [:project_id])
    create index(:project_epics, [:harvest_sync_at])
    create index(:project_epics, [:jira_sync_at])
  end
end
