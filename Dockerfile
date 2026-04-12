FROM node:22-alpine

WORKDIR /app

# --- Backend ---
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install

# --- Frontend ---
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

# Copiar código fuente
WORKDIR /app
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build frontend (VITE_* vars se inyectan en tiempo de build)
RUN cd frontend && npm run build

# Build backend TypeScript
RUN cd backend && npm run build

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
