# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 — Build the static Docusaurus blog
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first so the layer stays cached until the lockfile moves.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Then copy the sources and build. `docusaurus build` emits /app/build.
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 — Serve with Nginx (lightweight and secure)
# ---------------------------------------------------------------------------
FROM nginx:alpine AS runtime

LABEL org.opencontainers.image.title="Truslay Blog" \
      org.opencontainers.image.description="Truslay Blog — field notes on deterministic, fail-closed security for autonomous AI agents." \
      org.opencontainers.image.url="https://blog.truslay.com" \
      org.opencontainers.image.source="https://github.com/cochinoraptor/Truslay-Blog"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
