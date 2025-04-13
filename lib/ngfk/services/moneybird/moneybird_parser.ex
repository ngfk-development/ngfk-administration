defmodule Ngfk.Services.Moneybird.MoneybirdParser do
  @moduledoc false

  def parse_contact_person(person) do
    %{
      company: %{moneybird_id: person["contact_id"]},
      moneybird_id: person["id"],
      moneybird_version: person["version"],
      first_name: person["firstname"],
      last_name: person["lastname"],
      phone: person["phone"],
      email: person["email"],
      title: person["department"]
    }
  end

  def parse_contact(contact) do
    %{
      moneybird_id: contact["id"],
      moneybird_version: contact["version"],
      customer_number: contact["customer_id"],
      name: contact["company_name"],
      address: contact["address1"],
      zip_code: contact["zipcode"],
      city: contact["city"],
      country: contact["country"],
      chamber_of_commerce_number: contact["chamber_of_commerce"],
      tax_number: contact["tax_number"],
      contacts: Enum.map(contact["contact_people"], &parse_contact_person/1)
    }
  end

  def parse_project(project) do
    [_, code, name] = Regex.run(~r/^([^:]+): (.*)$/, Map.get(project, "name"))

    %{
      moneybird_id: Map.get(project, "id"),
      name: name,
      code: code
    }
  end

  def parse_time_entry(entry) do
    %{
      project: entry |> Map.get("project") |> parse_project(),
      user: %{moneybird_id: get_in(entry, ["user", "id"])},
      moneybird_id: Map.get(entry, "id"),
      description: Map.get(entry, "description"),
      time_started: entry |> Map.get("started_at") |> from_iso8601(),
      time_ended: entry |> Map.get("ended_at") |> from_iso8601()
    }
  end

  def parse_user(user) do
    %{
      moneybird_id: Map.get(user, "id"),
      email: Map.get(user, "email")
    }
  end

  defp from_iso8601(nil), do: nil

  defp from_iso8601(string) do
    case DateTime.from_iso8601(string) do
      {:ok, datetime, _} -> DateTime.shift_zone!(datetime, "Europe/Amsterdam")
      {:error, _} -> nil
    end
  end
end
