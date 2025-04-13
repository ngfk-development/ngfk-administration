defmodule Ngfk.Helpers.SyncError do
  @moduledoc false
  alias Ngfk.Helpers.SyncContext

  defexception [:action, :context, :message]

  @type t(data_type) :: %__MODULE__{
          action: atom(),
          context: SyncContext.t(data_type),
          message: String.t()
        }

  @spec new(SyncContext.t(T), atom(), String.t()) :: t(T)
  def new(%SyncContext{} = context, action, message) when is_atom(action) and is_binary(message),
    do: struct(__MODULE__, %{action: action, context: context, message: message})
end
