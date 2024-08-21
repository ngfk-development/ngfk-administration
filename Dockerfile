FROM node:22.6.0

WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node . .

RUN apt-get update && apt-get install -y tini
RUN npm i -g bun@1.1.24 && bun install

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
  CMD curl -f http://localhost:${PORT:-4000}/live || exit 1 

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bun", "run", "start"]

USER node
