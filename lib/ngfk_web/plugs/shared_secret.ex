defmodule NgfkWeb.Plugs.SharedSecret do
  @moduledoc false
  import Plug.Conn

  @header "x-shared-secret"

  def init(opts), do: opts

  def call(conn, _opts) do
    secret = Application.fetch_env!(:ngfk, NgfkWeb.Endpoint)[:shared_secret]

    case get_req_header(conn, @header) do
      [^secret] -> conn
      _ -> conn |> send_resp(:unauthorized, "Unauthorized") |> halt()
    end
  end
end
