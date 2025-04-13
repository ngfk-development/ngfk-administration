defmodule Ngfk.Services.Jira.JiraApi do
  @moduledoc """
  API client for Jira.
  https://developer.atlassian.com/cloud/jira/platform/rest/v3
  """
  use Ngfk, :api

  alias Ngfk.Projects.Project
  alias Ngfk.Services.Jira.JiraParser

  def epics_get(opts \\ []) do
    updated = Keyword.get(opts, :updated_since, nil)

    jql =
      if updated,
        do: "IssueType = Epic AND updated >= \"#{Calendar.strftime(updated, "%Y-%m-%d %H:%M")}\"",
        else: "IssueType = Epic"

    [
      params: [fields: "id,key,status,summary", jql: jql],
      value_key: "issues"
    ]
    |> search_jql_get()
    |> case do
      {:ok, epics} -> {:ok, Enum.map(epics, &JiraParser.parse_epic/1)}
      {:error, reason} -> {:error, reason}
    end
  end

  def search_jql_get(opts \\ []) do
    fetch_paginated("/search/jql", :get, opts)
  end

  def projects_get(opts \\ []) do
    params = opts |> Keyword.get(:keys, []) |> Enum.map(&{:keys, &1})

    case fetch_paginated("/project/search", :get, params: params) do
      {:ok, projects} -> {:ok, Enum.map(projects, &JiraParser.parse_project/1)}
      {:error, reason} -> {:error, reason}
    end
  end

  def projects_put(%Project{} = project) when not is_nil(project.jira_id) do
    data = %{
      name: project.name
    }

    case fetch("/project/#{project.jira_id}", :put, json: data) do
      {:ok, data} -> {:ok, JiraParser.parse_project(data)}
      {:error, reason} -> {:error, reason}
    end
  end

  def users_search_get do
    case fetch_paginated("/users/search", :get) do
      {:ok, users} -> {:ok, users |> Enum.map(&JiraParser.parse_user(&1)) |> Enum.reject(&is_nil(&1.email))}
      {:error, reason} -> {:error, reason}
    end
  end

  defp fetch_paginated(path, method, opts \\ []) do
    opts = put_params(opts, &Keyword.put_new(&1, :maxResults, 50))
    fetch_paginated(path, method, opts, [])
  end

  defp fetch_paginated(path, method, opts, acc) do
    page = opts |> Keyword.get(:params, []) |> Keyword.get(:startAt, 0)
    per_page = opts |> Keyword.get(:params, []) |> Keyword.get(:maxResults, 50)
    value_key = Keyword.get(opts, :value_key, "values")

    case fetch(path, method, opts) do
      {:ok, %{^value_key => values, "nextPage" => next}} when is_binary(next) ->
        fetch_paginated(next, method, [], acc ++ values)

      {:ok, %{^value_key => values, "nextPageToken" => token}} when is_binary(token) ->
        fetch_paginated(path, method, put_params(opts, nextPageToken: token), acc ++ values)

      {:ok, %{^value_key => values}} ->
        {:ok, acc ++ values}

      {:ok, []} ->
        {:ok, acc}

      {:ok, data} when is_list(data) and length(data) < per_page ->
        {:ok, acc ++ data}

      {:ok, data} when is_list(data) and length(data) == per_page ->
        fetch_paginated(path, method, put_params(opts, startAt: page + 1), acc ++ data)

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp fetch(path, method, opts) do
    [
      base_url: get_env(:endpoint),
      headers: [
        {"Authorization", "Basic #{get_api_token()}"},
        {"Accept", "application/json"}
      ],
      method: method,
      url: path,
      params: Keyword.get(opts, :params, %{}),
      json: Keyword.get(opts, :json)
    ]
    |> Req.new()
    |> ReqLogger.attach()
    |> Req.request()
    |> case do
      {:ok, %Req.Response{body: body, status: status}} when status >= 200 and status < 300 -> {:ok, body}
      {:ok, %Req.Response{body: body}} -> {:error, body}
      {:error, error} -> {:error, error}
    end
  end

  defp put_params(opts, fun) when is_function(fun) do
    opts
    |> Keyword.put_new(:params, [])
    |> Keyword.update!(:params, fun)
  end

  defp put_params(opts, params) when is_list(params) do
    opts
    |> Keyword.put_new(:params, [])
    |> Keyword.update!(:params, fn current ->
      Enum.reduce(params, current, fn {key, value}, acc -> Keyword.put(acc, key, value) end)
    end)
  end

  defp get_api_token, do: Base.encode64("#{get_env(:username)}:#{get_env(:token)}")
  defp get_env(key), do: Application.fetch_env!(:ngfk, :jira)[key]
end
