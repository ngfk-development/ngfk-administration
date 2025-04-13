defmodule Ngfk.Helpers.ReqLogger do
  @moduledoc false
  require Logger

  def attach(request) do
    request
    |> Req.Request.append_request_steps(log_request: &log_request/1)
    |> Req.Request.append_response_steps(log_response: &log_response/1)
  end

  defp log_request(request) do
    request
  end

  defp log_response({request, response}) do
    Logger.info("#{String.upcase(to_string(request.method))} #{response.status} #{full_url(request)}")
    {request, response}
  end

  defp full_url(%Req.Request{url: %URI{} = uri, options: opts}) do
    query =
      case Map.get(opts, :params, []) do
        [] -> uri.query
        params -> URI.encode_query(params)
      end

    URI.to_string(%{uri | query: query})
  end
end
