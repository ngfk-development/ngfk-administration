defmodule Ngfk.Projects.ProjectSearch do
  @moduledoc false
  use Ngfk, :search

  alias Ngfk.Projects.Project

  def search(opts \\ []) do
    Project
    |> with_search(opts)
    |> with_unique(opts, :harvest_id)
    |> with_unique(opts, :jira_id)
    |> with_unique(opts, :moneybird_id)
    |> with_unique(opts, :code)
    |> Repo.all()
    |> then(&{:ok, &1})
  end
end
