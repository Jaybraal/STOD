import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import syncRouter from './routes/sync';

const app = express();
const PORT = process.env.PORT || 3001;

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

// Rutas
app.use('/api/sync', syncLimiter, syncRouter);

app.listen(PORT, () => {
  console.log(`[STOD Backend] Servidor corriendo en http://localhost:${PORT}`);
});
