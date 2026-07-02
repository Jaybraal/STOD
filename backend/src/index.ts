import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { existsSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import syncRouter from './routes/sync';
import adminRouter from './routes/admin';
import chatRouter from './routes/chat';
import authRouter from './routes/auth';
import webhookRouter from './routes/webhook';
import { ensureIndexes } from './services/indexing';
import PouchDB from 'pouchdb';

// Inicializar Firebase Admin
if (process.env.FIREBASE_PRIVATE_KEY) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[STOD] Firebase Admin initialized ✓');
  } catch (err) {
    console.warn('[STOD] Firebase Admin already initialized or error:', err instanceof Error ? err.message : err);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Necesario para express-rate-limit detrás de proxies (Railway, Render, etc.)
app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

app.use(express.json());

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50,
  message: { error: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
});
app.use(limiter);

// Rate limiting estricto para rutas de sync
const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de sincronización. Intenta en 15 minutos.' },
});

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas API
app.use('/api/sync', syncLimiter, syncRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);
app.use('/api/auth', authRouter);
app.use('/api/webhooks', webhookRouter);

// Servir frontend en producción
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, async () => {
  console.log(`[STOD Backend] Servidor corriendo en http://localhost:${PORT}`);

  // Inicializar índices de base de datos (opcional - solo si COUCHDB_URL está configurado)
  if (process.env.COUCHDB_URL) {
    try {
      const localDb = new PouchDB(`${process.env.COUCHDB_URL}/stod_local`, { skip_setup: true });
      await ensureIndexes(localDb);
      console.log('[STOD] Índices de base de datos inicializados ✓');
    } catch (err) {
      console.warn('[STOD] Advertencia: No se pudieron inicializar índices:', err instanceof Error ? err.message : err);
    }
  }
});
