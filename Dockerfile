# Multi-stage build for PO Growth Assessment App
# Optimized for Koyeb deployment

# ============================================
# Stage 1: Build React Frontend
# ============================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better caching
COPY frontend/package.json frontend/yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy frontend source
COPY frontend/ ./

# Build frontend - empty REACT_APP_BACKEND_URL for same-origin API calls
ENV REACT_APP_BACKEND_URL=""
RUN yarn build

# ============================================
# Stage 2: Production Python Backend
# ============================================
FROM python:3.11-slim AS production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/server.py ./
COPY backend/.env.example ./.env.example

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/build ./static

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Start application
CMD uvicorn server:app --host 0.0.0.0 --port ${PORT}
