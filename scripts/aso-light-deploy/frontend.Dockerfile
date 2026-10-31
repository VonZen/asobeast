FROM node:24-alpine AS build
ARG SOURCE_SHA=7b16a02aea78a1f55c101f3dfbb622894b01a041
RUN apk add --no-cache git ca-certificates
RUN mkdir /src && cd /src && git init -q && git remote add origin https://github.com/overx-ai/aso-light.git && git fetch --depth 1 origin "${SOURCE_SHA}" && git checkout -q --detach FETCH_HEAD
WORKDIR /src/frontend
RUN npm ci --no-audit --no-fund
RUN npm run build

FROM node:24-alpine
COPY --from=build /src/frontend/dist /srv/www
COPY server.mjs /srv/server.mjs
ENV STATIC_ROOT=/srv/www PORT=80
EXPOSE 80
CMD ["node","/srv/server.mjs"]
