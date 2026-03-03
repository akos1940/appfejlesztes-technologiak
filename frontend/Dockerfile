# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . ./
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# With the new Angular application builder, the browser build output is under dist/<project>/browser
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
