# Plataforma web compilada y servida por Caddy (https automático con Let's Encrypt).
# Se construye desde deploy/docker-compose.prod.yml del repositorio ViaDeep-backend.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_CARTO_API_KEY=""
ENV VITE_CARTO_API_KEY=$VITE_CARTO_API_KEY
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
