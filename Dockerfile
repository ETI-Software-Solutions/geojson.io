FROM node:lts-buster-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --silent
COPY . .
RUN npm run build

FROM nginx:1.27.1-alpine
COPY --from=builder /app/dist /tmp/dist
COPY index.html /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --chmod=755 entrypoint.sh /docker-entrypoint.d/entrypoint.sh
EXPOSE 80