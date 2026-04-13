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

# Declarar build args para que Railway los inyecte en tiempo de build
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_API_URL

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_API_URL=$VITE_API_URL

# Build frontend (VITE_* vars se inyectan en tiempo de build)
RUN cd frontend && npm run build

# Build backend TypeScript
RUN cd backend && npm run build

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
