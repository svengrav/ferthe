# Production Dockerfile for ferthe-core API
FROM denoland/deno:2.6.8

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy core package → /app/core/
COPY core/ ./core/

# Copy shared package → /app/shared/ (matches deno.json import alias "../shared/" from /app/core/)
COPY shared/ ./shared/

# Copy web content → /app/web/content/ (consistent path, no renaming)
COPY web/content/ ./web/content/

# Install dependencies (run from core/ so deno.json is found)
WORKDIR /app/core
RUN deno install

# Environment
ENV PRODUCTION=true
ENV PORT=7000
ENV HOST=0.0.0.0
ENV CONTENT_DIR=/app/web/content

# Expose API port
EXPOSE 7000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:7000/api/health || exit 1

# Start server
CMD ["deno", "run", "--allow-all", "--sloppy-imports", "main.ts"]
