FROM node:18-alpine as build

WORKDIR /app
COPY . .

ENV NODE_ENV=production
RUN yarn install
RUN yarn build


FROM directus/directus:10.3

COPY --from=build /app/app/directus/dist                  /directus/extensions/directus-extension-ngfk-administration/dist
COPY --from=build /app/app/directus/package.json          /directus/extensions/directus-extension-ngfk-administration/package.json
COPY --from=build /app/app/directus/database/migrations   /directus/extensions/migrations
COPY --from=build /app/app/directus/database/snapshot.yml /directus/snapshot.yml

CMD : \
  && node /directus/cli.js bootstrap \
  && node /directus/cli.js schema apply -y /directus/snapshot.yml \
  && node /directus/cli.js start;
