FROM node:22.6.0 as build

WORKDIR /app
ENV NODE_ENV=production
COPY . .

RUN npm i -g bun@1.1.24 && bun install && bun run build


FROM node:22.6.0

WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node --from=build /app/dist         /app/dist
COPY --chown=node:node --from=build /app/bun.lockb    /app/bun.lockb
COPY --chown=node:node --from=build /app/package.json /app/package.json

RUN apt-get update && apt-get install -y tini
RUN npm i -g bun@1.1.24 && bun install

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
  CMD curl -f http://localhost:${PORT:-4000}/live || exit 1 

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bun", "run", "start"]

USER node
