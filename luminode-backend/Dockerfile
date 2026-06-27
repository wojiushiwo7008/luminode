# ---- builder ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# 编译 better-sqlite3 需要 python + 编译链
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc -p .

# 把非 .ts 资源 (schema.sql) 复制到 dist
RUN cp -r src/db/schema.sql dist/db/schema.sql || true

# ---- runtime ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

# 只装运行期依赖,不再装编译工具
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# 数据库目录,会被 volume 覆盖
RUN mkdir -p /app/data /app/config

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
