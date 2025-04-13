defmodule Ngfk.Helpers.Search do
  @moduledoc false
  import Ecto.Query

  def with_search(query, opts) do
    query
    |> with_preload(opts)
    |> with_query(opts)
    |> with_unique(opts, :id)
  end

  defp with_preload(query, opts) do
    case Keyword.get(opts, :preload) do
      preload when not is_nil(preload) -> preload(query, ^preload)
      _ -> query
    end
  end

  defp with_query(query, opts) do
    case Keyword.get(opts, :query) do
      query_fn when is_function(query_fn, 1) -> query_fn.(query)
      query_fn when is_function(query_fn, 2) -> query_fn.(query, opts)
      _ -> query
    end
  end

  def with_unique(query, opts, key) do
    case Keyword.get(opts, key) do
      :empty -> where(query, ^dynamic([r], is_nil(field(r, ^key))))
      :not_empty -> where(query, ^dynamic([r], not is_nil(field(r, ^key))))
      value when is_list(value) -> where(query, ^dynamic([r], field(r, ^key) in ^value))
      value when not is_nil(value) -> query |> where(^dynamic([r], field(r, ^key) == ^value)) |> limit(1)
      _ -> query
    end
  end
end
