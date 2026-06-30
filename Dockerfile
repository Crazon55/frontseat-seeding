# Frontseat Seeding — single-container showcase (React + FastAPI)
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
ENV REACT_APP_SHOWCASE_MODE=true
ENV REACT_APP_BACKEND_URL=
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/build ./backend/static
WORKDIR /app/backend
ENV PORT=8000
EXPOSE 8000
CMD uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}
