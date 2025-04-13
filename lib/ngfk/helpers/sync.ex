defmodule Ngfk.Helpers.Sync do
  @moduledoc false
  alias Ecto.Changeset
  alias Ecto.Multi
  alias Ngfk.Helpers.SyncContext
  alias Ngfk.Helpers.SyncError
  alias Ngfk.Repo

  @sync_keys [:harvest_sync_at, :moneybird_sync_at, :jira_sync_at]

  @type result(data_type) :: {:ok, SyncContext.t(data_type)} | {:error, SyncError.t(data_type)}

  @spec action_create(SyncContext.t(T), (T -> {:ok, any()} | {:error, any()}), SyncContext.opts(T)) :: SyncContext.t(T)
  def action_create(%SyncContext{} = context, func, overrides \\ []),
    do: SyncContext.add_action(context, :create, func, overrides)

  @spec action_read(SyncContext.t(T), (-> {:ok, any()} | {:error, any()}), SyncContext.opts(T)) :: SyncContext.t(T)
  def action_read(%SyncContext{} = context, func, overrides \\ []),
    do: SyncContext.add_action(context, :read, func, overrides)

  @spec action_update(SyncContext.t(T), (T -> {:ok, any()} | {:error, any()}), SyncContext.opts(T)) :: SyncContext.t(T)
  def action_update(%SyncContext{} = context, func, overrides \\ []),
    do: SyncContext.add_action(context, :update, func, overrides)

  @spec continue_with(result(T) | SyncContext.t(T), SyncContext.opts(T)) :: SyncContext.t(T)
  def continue_with({:ok, %SyncContext{} = context}, opts), do: SyncContext.continue_with(context, opts)
  def continue_with({:error, %SyncError{} = error}, opts), do: SyncContext.continue_with(error, opts)
  def continue_with(%SyncContext{} = context, opts), do: SyncContext.continue_with(context, opts)

  @spec execute(SyncContext.t(T)) :: result(T)
  def execute(%SyncContext{error: %SyncError{} = error}), do: {:error, error}

  @spec execute(SyncContext.t(T)) :: result(T)
  def execute(%SyncContext{} = context) do
    order = [:read, :update, :create]

    context.state_actions
    |> Enum.sort_by(fn {action, _, _} -> Enum.find_index(order, &(&1 == action)) end)
    |> Enum.reject(fn {action, _, _} -> action not in context.only end)
    |> Enum.reduce_while({:ok, context}, fn {action, func, overrides}, {:ok, context} ->
      case do_action(context, action, func, overrides) do
        {:ok, %SyncContext{} = context} -> {:cont, {:ok, context}}
        {:error, %SyncError{} = error} -> {:halt, {:error, error}}
      end
    end)
  end

  @spec new(SyncContext.opts(T)) :: SyncContext.t(T)
  def new(opts), do: SyncContext.new(opts)

  defp do_action(%SyncContext{} = context, action, func, overrides) do
    original_opts = Map.take(context, Keyword.keys(overrides))

    case context |> Map.merge(Map.new(overrides)) |> do_action(action, func) do
      {:ok, %SyncContext{} = context} -> {:ok, Map.merge(context, original_opts)}
      {:error, %SyncError{} = error} -> {:error, put_in(error.context, Map.merge(error.context, original_opts))}
    end
  end

  defp do_action(%SyncContext{} = context, :create = action, create) do
    with {:ok, context, records} <- run_search(context, action),
         {:ok, context, data} <- run_actions(context, create, Enum.map(records, &[&1])),
         {:ok, context, changesets} <- run_changesets(context, data, records),
         {:ok, context, records} <- run_update(context, changesets) do
      {:ok, SyncContext.assign_create(context, records)}
    else
      {:error, context, message} -> {:error, SyncError.new(context, action, message)}
    end
  end

  defp do_action(%SyncContext{} = context, :read = action, read) do
    with {:ok, context, data} <- run_action(context, read),
         {:ok, context, search} <- run_search(context, action, get_search_ids(context, data)),
         {:ok, context, changesets} <- run_changesets(context, data, search),
         {:ok, context, records} <- run_upsert(context, changesets),
         {:ok, context} <- run_enqueue_updates(context, action, data) do
      {:ok, SyncContext.assign_read(context, records)}
    else
      {:error, context, message} -> {:error, SyncError.new(context, action, message)}
    end
  end

  defp do_action(%SyncContext{} = context, :update = action, update) do
    with {:ok, context, records} <- run_search(context, action),
         {:ok, context, records} <- run_dequeue_updates(context, records),
         {:ok, context, data} <- run_actions(context, update, Enum.map(records, &[&1])),
         {:ok, context, changesets} <- run_changesets(context, data, records),
         {:ok, context, records} <- run_update(context, changesets) do
      {:ok, SyncContext.assign_update(context, records)}
    else
      {:error, context, message} -> {:error, SyncError.new(context, action, message)}
    end
  end

  defp get_relevant_fields(%Changeset{} = changeset), do: get_relevant_fields(changeset.changes, changeset.data)
  defp get_relevant_fields(data, %{__struct__: struct}), do: get_relevant_fields(data, struct.__schema__(:fields))
  defp get_relevant_fields(data, fields), do: data |> Map.keys() |> Enum.filter(fn field -> field in fields end)

  defp get_search_ids(%SyncContext{} = context, records),
    do: [{context.key, Enum.map(records, &Map.get(&1, context.key))}]

  defp get_transaction_result(data, context) do
    case data do
      {:ok, %{} = data} -> {:ok, context, Map.values(data)}
      {:error, error} -> {:error, context, error}
    end
  end

  defp run_actions(%SyncContext{} = context, func, args) when is_function(func) and is_list(args) do
    Enum.reduce_while(args, {:ok, context, []}, fn args, {:ok, context, acc} ->
      case run_action(context, func, args) do
        {:ok, context, data} -> {:cont, {:ok, context, acc ++ [data]}}
        {:error, context, error} -> {:halt, {:error, context, error}}
      end
    end)
  end

  defp run_action(%SyncContext{} = context, func, args \\ []) when is_function(func) do
    case apply(func, args) do
      {:ok, data} -> {:ok, context, data}
      {:error, error} -> {:error, context, error}
    end
  end

  defp run_changesets(%SyncContext{} = context, left, right) do
    context
    |> zip(left, right)
    |> Enum.map(fn
      {data, record} when is_map(data) or is_struct(record) -> context.changeset.(record, data)
      {record, data} when is_map(data) or is_struct(record) -> context.changeset.(record, data)
    end)
    |> then(&{:ok, context, &1})
  end

  defp run_dequeue_updates(%SyncContext{} = context, data) do
    data = Enum.uniq_by(context.state_update_queue ++ data, & &1.id)
    context = SyncContext.dequeue_updates(context)
    {:ok, context, data}
  end

  defp run_enqueue_updates(%SyncContext{} = context, action, data) do
    with {:enabled, true} <- {:enabled, SyncContext.has_action(context, :update)},
         {:ok, context, records} <- run_search(context, action, get_search_ids(context, data)) do
      context
      |> zip(data, records)
      |> Enum.filter(fn {data, record} -> update_required?(data, record) end)
      |> Enum.map(&elem(&1, 1))
      |> then(&{:ok, SyncContext.enqueue_updates(context, &1)})
    else
      {:enabled, false} -> {:ok, context}
    end
  end

  defp run_search(%SyncContext{} = context, action, opts \\ []) do
    search_args =
      []
      |> Keyword.new()
      |> Keyword.merge(Map.get(context, :search_args, []))
      |> Keyword.merge(Map.get(context, String.to_existing_atom("search_args_#{action}"), []))
      |> Keyword.merge(opts)

    case context.search.(search_args) do
      {:ok, records} -> {:ok, context, records}
      {:error, error} -> {:error, context, error}
    end
  end

  defp run_update(%SyncContext{} = context, changesets) do
    changesets
    |> Enum.filter(fn changeset -> map_size(changeset.changes) > 0 end)
    |> Enum.reduce(Multi.new(), fn %Changeset{} = changeset, acc ->
      Multi.update(
        acc,
        Map.get(changeset.changes, context.key, Map.get(changeset.data, context.key)),
        changeset,
        conflict_target: [context.key],
        on_conflict: {:replace, get_relevant_fields(changeset)}
      )
    end)
    |> Repo.transaction()
    |> get_transaction_result(context)
  end

  defp run_upsert(%SyncContext{} = context, changesets) do
    changesets
    |> Enum.filter(fn %Changeset{changes: changes} -> changes |> Map.drop(@sync_keys) |> map_size() > 0 end)
    |> Enum.reduce(Multi.new(), fn %Changeset{} = changeset, acc ->
      Multi.insert_or_update(
        acc,
        Map.get(changeset.changes, context.key, Map.get(changeset.data, context.key)),
        changeset,
        conflict_target: [context.key],
        on_conflict: {:replace, get_relevant_fields(changeset)}
      )
    end)
    |> Repo.transaction()
    |> get_transaction_result(context)
  end

  defp update_check_normalized(map, field), do: map |> Map.get(field) |> update_check_normalized()
  defp update_check_normalized(%DateTime{} = value), do: %{DateTime.shift_zone!(value, "Etc/UTC") | microsecond: {0, 0}}
  defp update_check_normalized(value), do: value

  defp update_required?(data, record) do
    data
    |> get_relevant_fields(record)
    |> Enum.any?(fn field -> update_check_normalized(data, field) != update_check_normalized(record, field) end)
  end

  defp zip(%SyncContext{} = context, left, right) do
    map = Map.new(right, &{Map.get(&1, context.key), &1})

    Enum.map(left, fn left_item ->
      left_id = Map.get(left_item, context.key)
      right_item = Map.get(map, left_id)
      {left_item, right_item}
    end)
  end
end
