FROM elixir:1.18-slim AS builder

WORKDIR /app
ENV MIX_ENV=prod
ENV MIX_HOME=/opt/mix

RUN apt-get update && apt-get install -y build-essential git curl

COPY . .

RUN mix do local.hex --force, local.rebar --force
RUN mix deps.get --only prod
RUN mix deps.compile
RUN mix phx.gen.release
RUN mix release


FROM elixir:1.18-slim

WORKDIR /app
ENV MIX_ENV=prod
ENV MIX_HOME=/opt/mix

RUN apt-get update && apt-get install -y libstdc++6 openssl libncurses5 locales ca-certificates && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/_build/prod/rel/ngfk .
COPY ./entrypoint.sh .

ENTRYPOINT ["./entrypoint.sh"]
CMD ["./bin/server"]
