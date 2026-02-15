# Single-stage build for Cloud Depot
FROM denoland/deno:2.6.8

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Carefull here, dont just use / as it will cause issues with deno install and caching
WORKDIR /app

# Copy workspace files
COPY deno.json ./
COPY vite.config.ts ./

COPY index.html ./
COPY app/ ./app/
COPY api/ ./api/
COPY content/ ./content/
COPY public/ ./public/

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
