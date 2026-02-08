# Single-stage build for Cloud Depot
FROM denoland/deno:2.1.4

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace files
COPY deno.json ./
COPY app/ ./app/
COPY api/ ./api/
COPY content/ ./content/

# Build frontend
RUN deno install

RUN deno task build

# Set environment
ENV SERVE_STATIC=true
ENV PORT=8000

# Expose port
EXPOSE 8000

# Start server with static file serving
CMD ["deno", "run", "-A", "api/main.ts"]
