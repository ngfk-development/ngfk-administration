defmodule NgfkWeb.Plugs.SharedSecret do
  @moduledoc false
  import Plug.Conn

  @header "x-shared-secret"
  @param "access_token"

  def init(opts), do: opts

  def call(conn, _opts) do
    secret = Application.fetch_env!(:ngfk, NgfkWeb.Endpoint)[:shared_secret]

    if valid_secret?(conn, secret) do
      conn
    else
      conn |> send_resp(:unauthorized, "Unauthorized") |> halt()
    end
  end

  defp valid_secret?(conn, secret) do
    header_match = get_req_header(conn, @header) == [secret]
    param_match = conn.params[@param] == secret
    header_match or param_match
  end
end
