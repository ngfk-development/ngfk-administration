defmodule Ngfk.Services.Harvest.HarvestParser do
  @moduledoc false

  def parse_client(client) do
    [_, name, customer_number] = Regex.run(~r/^(.*) \((.*)\)$/, Map.get(client, "name"))

    %{
      harvest_id: Map.get(client, "id"),
      name: name,
      customer_number: customer_number
    }
  end

  def parse_contact(contact) do
    %{
      harvest_id: Map.get(contact, "id"),
      first_name: Map.get(contact, "first_name"),
      last_name: Map.get(contact, "last_name"),
      phone: Map.get(contact, "phone_mobile"),
      email: Map.get(contact, "email"),
      title: Map.get(contact, "title")
    }
  end

  def parse_project(project) do
    %{
      company:
        with %{} = client <- Map.get(project, "client") do
          parse_client(client)
        end,
      harvest_id: Map.get(project, "id"),
      name: Map.get(project, "name"),
      code: Map.get(project, "code"),
      active: Map.get(project, "is_active"),
      billable: Map.get(project, "is_billable"),
      hourly_rate: project |> Map.get("hourly_rate") |> price_to_integer()
    }
  end

  def parse_task_assignment(assignment) do
    project = Map.get(assignment, "project")
    task = Map.get(assignment, "task")
    [task_code, _, task_title] = task |> Map.get("name") |> parse_task_name()

    %{
      harvest_assignment_id: Map.get(assignment, "id"),
      project: %{
        harvest_id: Map.get(project, "id"),
        name: Map.get(project, "name"),
        code: Map.get(project, "code")
      },
      code: task_code,
      title: task_title
    }
  end

  def parse_task(task) do
    [code, project_code, title] = task |> Map.get("name") |> parse_task_name()

    %{
      project: %{code: project_code},
      harvest_id: Map.get(task, "id"),
      code: code,
      title: title,
      archived: !Map.get(task, "is_active")
    }
  end

  def parse_time_entry(entry) do
    [task_code, _, task_title] = entry |> get_in(["task", "name"]) |> parse_task_name()

    day = Map.get(entry, "spent_date")
    started = Map.get(entry, "started_time")
    ended = Map.get(entry, "ended_time")

    %{
      user: %{harvest_id: get_in(entry, ["user", "id"])},
      project: %{harvest_id: get_in(entry, ["project", "id"])},
      epic: %{harvest_id: get_in(entry, ["task", "id"]), code: task_code, title: task_title},
      harvest_id: Map.get(entry, "id"),
      description: Map.get(entry, "notes", "-"),
      time_started: parse_time(day, started),
      time_ended: parse_time(day, ended)
    }
  end

  def parse_user(user) do
    %{
      harvest_id: Map.get(user, "id"),
      email: Map.get(user, "email")
    }
  end

  defp parse_time(_, nil), do: nil

  defp parse_time(day, time) do
    datetime =
      "#{day} #{time}"
      |> Timex.parse!("%Y-%m-%d %l:%M%P", :strftime)
      |> Timex.to_datetime("Europe/Amsterdam")

    if time == "12:00am", do: DateTime.add(datetime, 1, :day), else: datetime
  end

  defp parse_task_name(nil), do: [nil, nil, nil]

  defp parse_task_name(name) do
    case Regex.run(~r/^([0-9A-Z]+-[0-9]+) (.*)$/, name) do
      [_, code, title] -> Regex.run(~r/^(.*)-.*$/, code) ++ [title]
      nil -> [nil, nil, name]
    end
  end

  defp price_to_integer(nil), do: 0
  defp price_to_integer(price) when is_number(price), do: trunc(price * 100)
end
