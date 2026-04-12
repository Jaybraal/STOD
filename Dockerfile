FROM node:22-alpine

WORKDIR /app

# Copiar e instalar dependencias del backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Copiar e instalar dependencias del frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copiar código fuente
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build frontend (los VITE_* vars se inyectan en tiempo de build)
RUN cd frontend && npm run build

# Build backend
RUN cd backend && npm run build

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
