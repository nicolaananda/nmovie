# ============================================
# Backend Dockerfile (Node.js + Prisma)
# ============================================
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL untuk Prisma
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy prisma schema dan generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY src ./src/

EXPOSE 7001

# Script: jalankan migration lalu start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
