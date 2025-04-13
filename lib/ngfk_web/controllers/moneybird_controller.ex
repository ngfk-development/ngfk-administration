defmodule NgfkWeb.MoneybirdController do
  @moduledoc false
  use NgfkWeb, :controller

  alias Ngfk.Services.Moneybird
  alias Ngfk.Services.Synchronize

  @action_webhook_test ["test_webhook"]
  @action_company_sync ["contact_changed", "contact_created"]
  @action_company_contact_sync ["contact_person_created", "contact_person_updated"]

  def hook(conn, %{"action" => action, "entity" => entity}) do
    opts = [moneybird: [only: [:read]]]

    # Because of api limitations, a newly created contact person cannot be
    # handled using the sync process. We "manually" insert them here before
    # running the sync process.
    if action == "contact_person_created" do
      Moneybird.insert_contact_person(entity)
    end

    case action do
      action when action in @action_webhook_test -> :ok
      action when action in @action_company_sync -> Synchronize.sync_companies(opts)
      action when action in @action_company_contact_sync -> Synchronize.sync_company_contacts(opts)
    end

    # Always returns a success status, if anything is wrong with the sync
    # process we don't want moneybird to retry the failed webhook.
    conn |> put_status(200) |> json(%{status: "ok"})
  end
end
