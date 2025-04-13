defmodule Ngfk.Services.Moneybird.MoneybirdApi do
  @moduledoc """
  API client for Moneybird.
  https://developer.moneybird.com/
  """
  use Ngfk, :api

  alias Ngfk.Companies.Company
  alias Ngfk.Companies.CompanyContact
  alias Ngfk.Projects.Project
  alias Ngfk.Services.Moneybird.MoneybirdParser
  alias Ngfk.TimeEntries.TimeEntry

  @per_page 100

  def contact_people_get(contacts) do
    Enum.reduce_while(contacts, {:ok, []}, fn %CompanyContact{} = contact, {:ok, acc} ->
      case fetch(:get, "/contacts/#{contact.company.moneybird_id}/contact_people/#{contact.moneybird_id}") do
        {:ok, data} -> {:cont, {:ok, acc ++ [MoneybirdParser.parse_contact_person(data)]}}
        {:error, error} -> {:halt, {:error, error}}
      end
    end)
  end

  def contacts_filter_get(opts \\ []) do
    filter =
      opts
      |> Keyword.take([:created_after, :updated_after, :first_name, :last_name])
      |> Enum.map_join(",", fn
        {key, %DateTime{} = value} -> "#{key}:#{DateTime.to_iso8601(value)}"
        {key, value} -> "#{key}:#{value}"
      end)

    case fetch_paginated(:get, "/contacts/filter", params: %{page: 1, per_page: @per_page, filter: filter}) do
      {:ok, data} -> {:ok, Enum.map(data, &MoneybirdParser.parse_contact/1)}
      {:error, error} -> {:error, error}
    end
  end

  def contacts_patch(%Company{} = company) when not is_nil(company.moneybird_id) do
    data = %{
      contact: %{
        name: company.name,
        address1: company.address,
        zipcode: company.zip_code,
        city: company.city,
        country: company.country,
        chamber_of_commerce: company.chamber_of_commerce_number,
        tax_number: company.tax_number
      }
    }

    case fetch(:patch, "/contacts/#{company.moneybird_id}", json: data) do
      {:ok, body} -> {:ok, MoneybirdParser.parse_contact(body)}
      {:error, error} -> {:error, error}
    end
  end

  def projects_get do
    case fetch_paginated(:get, "/projects", params: %{page: 1, per_page: @per_page}) do
      {:ok, data} -> {:ok, Enum.map(data, &MoneybirdParser.parse_project/1)}
      {:error, error} -> {:error, error}
    end
  end

  def projects_post(%Project{moneybird_id: nil} = project) do
    data = %{
      project: %{
        name: "#{project.code}: #{project.name}"
      }
    }

    case fetch(:post, "/projects", json: data) do
      {:ok, data} -> {:ok, MoneybirdParser.parse_project(data)}
      {:error, error} -> {:error, error}
    end
  end

  def projects_patch(%Project{} = project) when not is_nil(project.moneybird_id) do
    data = %{
      project: %{
        name: "#{project.code}: #{project.name}"
      }
    }

    case fetch(:patch, "/projects/#{project.moneybird_id}", json: data) do
      {:ok, data} -> {:ok, MoneybirdParser.parse_project(data)}
      {:error, error} -> {:error, error}
    end
  end

  def time_entries_get(opts \\ []) do
    period_start = Calendar.strftime(opts[:updated_since] || ~D[2020-01-01], "%Y%m%d")
    period_end = Calendar.strftime(Date.utc_today(), "%Y%m%d")
    filter = "period:#{period_start}..#{period_end}"

    case fetch_paginated(:get, "/time_entries", params: %{page: 1, per_page: @per_page, filter: filter}) do
      {:ok, data} -> {:ok, Enum.map(data, &MoneybirdParser.parse_time_entry/1)}
      {:error, error} -> {:error, error}
    end
  end

  def time_entries_post(%TimeEntry{moneybird_id: nil} = entry) when not is_nil(entry.time_ended) do
    data = %{
      time_entry: %{
        user_id: get_in(entry.user.moneybird_id),
        contact_id: get_in(entry.project.company.moneybird_id),
        project_id: get_in(entry.project.moneybird_id),
        started_at: DateTime.to_iso8601(entry.time_started),
        ended_at: DateTime.to_iso8601(entry.time_ended),
        description: entry.description,
        billable: get_in(entry.project.billable)
      }
    }

    case fetch(:post, "/time_entries", json: data) do
      {:ok, data} -> {:ok, MoneybirdParser.parse_time_entry(data)}
      {:error, error} -> {:error, error}
    end
  end

  def time_entries_patch(%TimeEntry{} = entry) when not is_nil(entry.moneybird_id) and not is_nil(entry.time_ended) do
    data = %{
      time_entry: %{
        contact_id: get_in(entry.project.company.moneybird_id),
        project_id: get_in(entry.project.moneybird_id),
        started_at: DateTime.to_iso8601(entry.time_started),
        ended_at: DateTime.to_iso8601(entry.time_ended),
        description: entry.description,
        billable: get_in(entry.project.billable)
      }
    }

    case fetch(:patch, "/time_entries/#{entry.moneybird_id}", json: data) do
      {:ok, data} -> {:ok, MoneybirdParser.parse_time_entry(data)}
      {:error, error} -> {:error, error}
    end
  end

  def users_get do
    case fetch(:get, "/users") do
      {:ok, data} -> {:ok, Enum.map(data, &MoneybirdParser.parse_user/1)}
      {:error, error} -> {:error, error}
    end
  end

  defp fetch_paginated(method, path, [{:params, %{per_page: per_page, page: page}} | _] = opts, acc \\ []) do
    next_opts = Keyword.update!(opts, :params, &Map.put(&1, :page, page + 1))

    case fetch(method, path, opts) do
      {:ok, []} -> {:ok, acc}
      {:ok, data} when length(data) < per_page -> {:ok, acc ++ data}
      {:ok, data} -> fetch_paginated(method, path, next_opts, acc ++ data)
      {:error, reason} -> {:error, reason}
    end
  end

  defp fetch(method, path, opts \\ []) do
    [
      base_url: get_env(:endpoint),
      headers: [
        {"Authorization", "Bearer #{get_env(:token)}"},
        {"Content-Type", "application/json"}
      ],
      plug: get_env(:plug),
      method: method,
      url: path,
      params: opts[:params] || %{},
      json: opts[:json] || nil
    ]
    |> Req.new()
    |> ReqLogger.attach()
    |> Req.request()
    |> case do
      {:ok, %Req.Response{body: body}} -> {:ok, body}
      {:error, error} -> {:error, error}
    end
  end

  defp get_env(key), do: Application.fetch_env!(:ngfk, :moneybird)[key]
end
