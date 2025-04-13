defmodule Ngfk.Repo do
  use Ecto.Repo,
    otp_app: :ngfk,
    adapter: Ecto.Adapters.Postgres
end
