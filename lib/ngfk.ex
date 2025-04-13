defmodule Ngfk do
  @moduledoc """
  Ngfk keeps the contexts that define your domain
  and business logic.

  Contexts are also responsible for managing your data, regardless
  if it comes from the database, an external API or others.
  """

  @doc """
  When used, dispatch to the appropriate controller/live_view/etc.
  """

  def api do
    quote do
      alias Ngfk.Helpers.ReqLogger
    end
  end

  def schema do
    quote do
      use Ecto.Schema

      import Ecto.Changeset

      alias Ecto.Changeset

      def sync_now, do: DateTime.truncate(DateTime.utc_now(), :second)
    end
  end

  def search do
    quote do
      import Ecto.Query
      import Ngfk.Helpers.Search

      alias Ngfk.Repo
    end
  end

  def sync do
    quote do
      alias Ecto.Changeset
      alias Ngfk.Helpers.Sync
      alias Ngfk.Repo
    end
  end

  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end
