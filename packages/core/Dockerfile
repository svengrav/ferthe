# Production Dockerfile for ferthe-core API
FROM denoland/deno:2.6.8

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy core package files
COPY deno.json ./
COPY main.ts ./
COPY index.ts ./
COPY core.ts ./
COPY api/ ./api/
COPY config/ ./config/
COPY connectors/ ./connectors/
COPY features/ ./features/
COPY shared/ ./shared/
COPY store/ ./store/
COPY utils/ ./utils/

# Copy shared package (dependency)
COPY ../shared/ /shared/

# Copy web content (static)
COPY ../web/content/ /content/

# Install dependencies
RUN deno install

# Environment
ENV PRODUCTION=true
ENV PORT=7000
ENV HOST=0.0.0.0
ENV CONTENT_DIR=/content

# Expose API port
EXPOSE 7000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:7000/core/api/health || exit 1

# Start server
CMD ["deno", "run", "--allow-all", "main.ts"]
