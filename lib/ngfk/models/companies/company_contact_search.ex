defmodule Ngfk.Companies.CompanyContactSearch do
  @moduledoc false
  use Ngfk, :search

  alias Ngfk.Companies.CompanyContact

  def search(opts \\ []) do
    CompanyContact
    |> with_search(opts)
    |> with_unique(opts, :harvest_id)
    |> with_unique(opts, :moneybird_id)
    |> Repo.all()
    |> then(&{:ok, &1})
  end
end
