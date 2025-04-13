defmodule Ngfk.Projects.ProjectEpicSearch do
  @moduledoc false
  use Ngfk, :search

  alias Ngfk.Projects.ProjectEpic

  def search(opts \\ []) do
    ProjectEpic
    |> with_search(opts)
    |> with_unique(opts, :harvest_id)
    |> with_unique(opts, :harvest_assignment_id)
    |> with_unique(opts, :jira_id)
    |> with_unique(opts, :code)
    |> Repo.all()
    |> then(&{:ok, &1})
  end
end
