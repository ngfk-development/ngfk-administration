defmodule Ngfk.Companies.CompanySearch do
  @moduledoc false
  use Ngfk, :search

  alias Ngfk.Companies.Company

  def search(opts \\ []) do
    Company
    |> with_search(opts)
    |> with_unique(opts, :harvest_id)
    |> with_unique(opts, :moneybird_id)
    |> with_unique(opts, :customer_number)
    |> Repo.all()
    |> then(&{:ok, &1})
  end
end
