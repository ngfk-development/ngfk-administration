defmodule Ngfk.Helpers.SyncContext do
  @moduledoc false
  alias Ecto.Changeset
  alias Ngfk.Helpers.SyncError

  @actions [:create, :read, :update]

  defstruct key: :id,
            changeset: nil,
            only: @actions,
            search: nil,
            search_args: [],
            search_args_create: [],
            search_args_read: [],
            search_args_update: [],
            state_actions: [],
            state_update_queue: [],
            state: %{create: [], read: [], update: []},
            error: nil

  @type state_update_queue :: list(String.t())
  @type state(data_type) :: %{create: list(data_type), read: list(data_type), update: list(data_type)}

  @type t(data_type) :: %__MODULE__{
          key: atom() | nil,
          changeset: (struct(), any() -> Changeset.t(data_type)),
          only: list(atom()),
          search: (keyword() -> {:ok, list(data_type)}),
          search_args: keyword(),
          search_args_create: keyword(),
          search_args_read: keyword(),
          search_args_update: keyword(),
          state_actions: list({atom(), fun(), keyword()}),
          state_update_queue: state_update_queue(),
          state: state(data_type)
        }

  @type opts(data_type) :: [
          key: atom() | nil,
          changeset: (struct(), any() -> Changeset.t(data_type)),
          only: list(atom()),
          search: (keyword() -> {:ok, list(data_type)}),
          search_args: keyword(),
          search_args_create: keyword(),
          search_args_read: keyword(),
          search_args_update: keyword()
        ]

  @spec new(opts(T)) :: t(T)
  def new(opts), do: struct(__MODULE__, opts)

  def add_action(%__MODULE__{} = context, action, function, overrides) when action in @actions,
    do: Map.put(context, :state_actions, context.state_actions ++ [{action, function, overrides}])

  def assign_create(%__MODULE__{} = context, create), do: put_in(context.state.create, context.state.create ++ create)
  def assign_read(%__MODULE__{} = context, read), do: put_in(context.state.read, context.state.read ++ read)
  def assign_update(%__MODULE__{} = context, update), do: put_in(context.state.update, context.state.update ++ update)

  def continue_with(%__MODULE__{} = context, opts) do
    opts
    |> new()
    |> continue_with_option(context, opts, :key)
    |> continue_with_option(context, opts, :changeset)
    |> continue_with_option(context, opts, :only)
    |> continue_with_option(context, opts, :search)
    |> continue_with_option(context, opts, :search_args)
    |> continue_with_option(context, opts, :search_args_create)
    |> continue_with_option(context, opts, :search_args_read)
    |> continue_with_option(context, opts, :search_args_update)
    |> Map.put(:state, context.state)
  end

  def continue_with(%SyncError{} = error, opts) do
    error.context
    |> continue_with(opts)
    |> Map.put(:error, error)
  end

  def enqueue_updates(%__MODULE__{} = context, updates),
    do: Map.put(context, :state_update_queue, context.state_update_queue ++ updates)

  def dequeue_updates(%__MODULE__{} = context), do: Map.put(context, :state_update_queue, [])

  def has_action(%__MODULE__{} = context, action) when action in @actions,
    do: Enum.member?(context.only, action) and Enum.find(context.state_actions, &(elem(&1, 0) == action)) != nil

  defp continue_with_option(%__MODULE__{} = current, %__MODULE__{} = previous, opts, key),
    do: Map.put(current, key, Keyword.get(opts, key, Map.get(previous, key)))
end
