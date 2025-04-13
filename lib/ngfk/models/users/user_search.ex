defmodule Ngfk.Users.UserSearch do
  @moduledoc false
  use Ngfk, :search

  alias Ngfk.Users.User

  def search(opts \\ []) do
    User
    |> with_search(opts)
    |> with_unique(opts, :harvest_id)
    |> with_unique(opts, :jira_id)
    |> with_unique(opts, :moneybird_id)
    |> with_unique(opts, :email)
    |> Repo.all()
    |> then(&{:ok, &1})
  end
end
