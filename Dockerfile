# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# 1) deps install (prefer npm ci if lockfile exists)
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 2) build
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine

# Vite build output -> nginx html root
COPY --from=build /app/dist /usr/share/nginx/html

# NOTE:
# nginx config(default.conf)는 backend repo의 docker-compose에서
# /etc/nginx/conf.d/default.conf 로 마운트하여 덮어씁니다.
# 이 이미지에는 nginx.conf를 포함하지 않습니다.

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
