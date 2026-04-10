# ============================================
# Frontend Dockerfile (Vite + React)
# ============================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Build args untuk env variables saat build
ARG VITE_API_URL=http://localhost:7001/api
ARG VITE_SCRAPER_PROXY_URL=http://localhost:7001
ARG VITE_TMDB_API_KEY=

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SCRAPER_PROXY_URL=$VITE_SCRAPER_PROXY_URL
ENV VITE_TMDB_API_KEY=$VITE_TMDB_API_KEY

RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
