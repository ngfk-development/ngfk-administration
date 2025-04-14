defmodule NgfkWeb.SyncController do
  @moduledoc false
  use NgfkWeb, :controller

  alias Ngfk.Services.Synchronize

  def all(conn, _) do
    case Synchronize.sync() do
      :ok -> conn |> put_status(200) |> json(%{message: "ok"})
      _ -> conn |> put_status(500) |> json(%{code: "SYNC_ERROR", message: "Failed to sync"})
    end
  end
end
