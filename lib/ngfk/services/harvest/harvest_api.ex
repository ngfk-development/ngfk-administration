defmodule Ngfk.Services.Harvest.HarvestApi do
  @moduledoc """
  API client for Harvest.
  https://help.getharvest.com/api-v2/
  """
  use Ngfk, :api

  alias Ngfk.Companies.Company
  alias Ngfk.Companies.CompanyContact
  alias Ngfk.Projects.Project
  alias Ngfk.Projects.ProjectEpic
  alias Ngfk.Services.Harvest.HarvestParser
  alias Ngfk.Users.User

  @per_page 2000

  def clients_get(opts \\ []) do
    params = %{
      per_page: opts[:per_page] || @per_page,
      updated_since: to_iso8601(opts[:updated_since])
    }

    {:get, "/clients", params: params}
    |> fetch_paginated("clients")
    |> Enum.map(&HarvestParser.parse_client/1)
    |> then(&{:ok, &1})
  end

  def clients_patch(%Company{harvest_id: harvest_id} = company) when not is_nil(harvest_id) do
    data = %{
      name: "#{company.name} (#{company.customer_number})",
      is_active: true,
      address: "#{company.address}\n#{company.zip_code} #{company.city}",
      currency: "EUR"
    }

    case fetch({:patch, "/clients/#{harvest_id}", json: data}) do
      {:ok, body} -> {:ok, HarvestParser.parse_client(body)}
    end
  end

  def clients_post(%Company{harvest_id: nil} = company) do
    data = %{
      name: "#{company.name} (#{company.customer_number})",
      is_active: true,
      address: "#{company.address}\n#{company.zip_code} #{company.city}",
      currency: "EUR"
    }

    case fetch({:post, "/clients", json: data}) do
      {:ok, body} -> {:ok, HarvestParser.parse_client(body)}
    end
  end

  def clients_delete(%Company{} = client) when not is_nil(client.harvest_id) do
    case fetch({:delete, "/clients/#{client.harvest_id}", []}) do
      {:ok, _} -> {:ok, client}
    end
  end

  def contacts_get(opts \\ []) do
    params = %{
      client_id: opts[:client_id],
      per_page: opts[:per_page] || @per_page,
      updated_since: to_iso8601(opts[:updated_since])
    }

    {:get, "/contacts", params: params}
    |> fetch_paginated("contacts")
    |> Enum.map(&HarvestParser.parse_contact/1)
    |> then(&{:ok, &1})
  end

  def contacts_patch(%CompanyContact{harvest_id: harvest_id} = contact) when not is_nil(harvest_id) do
    data = %{
      client_id: contact.company.harvest_id,
      title: contact.title,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone_mobile: contact.phone
    }

    case fetch({:patch, "/contacts/#{harvest_id}", json: data}) do
      {:ok, body} -> {:ok, HarvestParser.parse_contact(body)}
    end
  end

  def contacts_post(%CompanyContact{harvest_id: nil} = contact, opts \\ []) do
    data = %{
      client_id: Keyword.get_lazy(opts, :company_id, fn -> contact.company.harvest_id end),
      title: contact.title,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone_mobile: contact.phone
    }

    case fetch({:post, "/contacts", json: data}) do
      {:ok, body} -> {:ok, HarvestParser.parse_contact(body)}
    end
  end

  def contacts_delete(%CompanyContact{} = contact) when not is_nil(contact.harvest_id) do
    case fetch({:delete, "/contacts/#{contact.harvest_id}", []}) do
      {:ok, _} -> {:ok, contact}
    end
  end

  def projects_get(opts \\ []) do
    params = %{
      is_active: opts[:is_active],
      per_page: opts[:per_page] || @per_page,
      updated_since: to_iso8601(opts[:updated_since])
    }

    {:get, "/projects", params: params}
    |> fetch_paginated("projects")
    |> Enum.map(&HarvestParser.parse_project/1)
    |> then(&{:ok, &1})
  end

  def task_assignments_get(opts \\ []) do
    params = %{
      is_active: opts[:is_active],
      per_page: opts[:per_page] || @per_page,
      updated_since: to_iso8601(opts[:updated_since])
    }

    {:get, "/task_assignments", params: params}
    |> fetch_paginated("task_assignments")
    |> Enum.map(&HarvestParser.parse_task_assignment/1)
    |> Enum.reject(&is_nil(&1.code))
    |> then(&{:ok, &1})
  end

  def task_assignments_post(%ProjectEpic{harvest_assignment_id: nil} = epic) do
    data = %{
      task_id: epic.harvest_id,
      is_active: true
    }

    case fetch({:post, "/projects/#{epic.project.harvest_id}/task_assignments", json: data}) do
      {:ok, body} -> {:ok, HarvestParser.parse_task_assignment(body)}
    end
  end

  def tasks_get(opts \\ []) do
    params = %{
      is_active: opts[:is_active],
      per_page: opts[:per_page] || @per_page,
      updated_since: to_iso8601(opts[:updated_since])
    }

    {:get, "/tasks", params: params}
    |> fetch_paginated("tasks")
    |> Enum.map(&HarvestParser.parse_task/1)
    |> Enum.reject(&is_nil(&1.code))
    |> then(&{:ok, &1})
  end

  def tasks_post(%ProjectEpic{harvest_id: nil} = epic) do
    data = %{
      name: "#{epic.code} #{epic.title}",
      is_active: !epic.archived,
      is_default: false
    }

    case fetch({:post, "/tasks", json: data}) do
      {:ok, body} -> {:ok, HarvestParser.parse_task(body)}
    end
  end

  def tasks_patch(%ProjectEpic{} = epic) when not is_nil(epic.harvest_id) do
    data = %{
      name: "#{epic.code} #{epic.title}",
      is_active: !epic.archived
    }

    case fetch({:patch, "/tasks/#{epic.harvest_id}", json: data}) do
      {:ok, body} -> {:ok, HarvestParser.parse_task(body)}
    end
  end

  def time_entries_get(opts \\ []) do
    params = %{
      per_page: opts[:per_page] || @per_page,
      updated_since: to_iso8601(opts[:updated_since])
    }

    {:get, "/time_entries", params: params}
    |> fetch_paginated("time_entries")
    |> Enum.map(&HarvestParser.parse_time_entry/1)
    |> then(&{:ok, &1})
  end

  def time_entries_post(
        %User{} = user,
        %Project{} = project,
        %ProjectEpic{} = epic,
        %{jira_id: _, code: _, title: _} = issue,
        opts \\ []
      ) do
    data = %{
      user_id: user.harvest_id,
      project_id: project.harvest_id,
      task_id: epic.harvest_id,
      spent_date: opts |> Keyword.get(:date, Date.utc_today()) |> Calendar.strftime("%Y-%m-%d"),
      notes: "#{issue.code}: #{issue.title}",
      external_reference: %{
        id: issue.jira_id,
        group_id: epic.jira_id,
        account_id: user.jira_id,
        permalink: "https://ngfk.atlassian.net/browse/#{issue.code}"
      }
    }

    case fetch({:post, "/time_entries", json: data}) do
      {:ok, body} -> {:ok, HarvestParser.parse_time_entry(body)}
    end
  end

  def users_get(opts \\ []) do
    params = %{
      is_active: opts[:is_active],
      per_page: opts[:per_page] || @per_page
    }

    {:get, "/users", params: params}
    |> fetch_paginated("users")
    |> Enum.map(&HarvestParser.parse_user/1)
    |> then(&{:ok, &1})
  end

  defp fetch_paginated({method, path, [{:params, %{per_page: _}} | _] = opts}, key) do
    Stream.resource(
      fn -> request(method, path, opts) end,
      fn req -> fetch_paginated_req(req, key) end,
      fn _ -> :ok end
    )
  end

  defp fetch_paginated_req(%Req.Request{method: method} = req, key) do
    case fetch(req) do
      {:ok, %{^key => records, "links" => %{"next" => nil}}} -> {records, nil}
      {:ok, %{^key => records, "links" => %{"next" => next}}} -> {records, request(method, next)}
      _ -> {[], nil}
    end
  end

  defp fetch_paginated_req(_, _), do: {:halt, nil}

  defp request(method, path, opts \\ []) do
    [
      base_url: get_env(:endpoint),
      headers: [
        {"Authorization", "Bearer #{get_env(:token)}"},
        {"Content-Type", "application/json"},
        {"Harvest-Account-Id", get_env(:account_id)}
      ],
      plug: get_env(:plug),
      method: method,
      url: path,
      params: opts[:params] || %{},
      json: opts[:json] || nil
    ]
    |> Req.new()
    |> ReqLogger.attach()
  end

  defp fetch(%Req.Request{} = req) do
    case Req.request(req) do
      {:ok, %Req.Response{body: body}} -> {:ok, body}
      {:error, error} -> {:error, error}
    end
  end

  defp fetch({method, path, opts}), do: method |> request(path, opts) |> fetch()

  defp to_iso8601(%DateTime{} = date), do: DateTime.to_iso8601(date)
  defp to_iso8601(_), do: nil

  defp get_env(key), do: Application.fetch_env!(:ngfk, :harvest)[key]
end
