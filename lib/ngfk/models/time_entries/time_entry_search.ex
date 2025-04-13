defmodule Ngfk.TimeEntries.TimeEntrySearch do
  @moduledoc false
  use Ngfk, :search

  alias Ngfk.TimeEntries.TimeEntry

  def search(opts \\ []) do
    TimeEntry
    |> with_search(opts)
    |> with_unique(opts, :harvest_id)
    |> with_unique(opts, :moneybird_id)
    |> with_unique(opts, :hash)
    |> Repo.all()
    |> then(&{:ok, &1})
  end
end
