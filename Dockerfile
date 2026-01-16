# syntax=docker/dockerfile:1.6

# Multi-arch ready (arm64/amd64). Use buildx with --platform for ARM builds.
# Example: docker buildx build --platform=linux/arm64 -t frontend-aimaker:dev .

FROM node:20-alpine

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# You can switch to your preferred package manager; default to npm
RUN npm ci || npm install

# Copy the rest of the source
COPY . .

# Vite dev server port is taken from project .env (VITE_PORT). Default is defined in vite.config.ts.

# Expose both the internal dev port and the host-facing convenience port.
# The app listens on VITE_PORT (3001 by default). Map host 3300 -> container 3001 when running.
EXPOSE 3001
EXPOSE 3300

# Run Vite in dev mode, bind to all interfaces so it's reachable from host.
# The port is resolved inside vite.config.ts from .env (VITE_PORT), so we don't pass --port here.
CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0"]
