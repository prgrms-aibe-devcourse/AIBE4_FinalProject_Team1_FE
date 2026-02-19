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

# nginx 설정 복사 ($connection_upgrade 변수 포함)
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
