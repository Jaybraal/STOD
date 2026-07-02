import { Router, Request, Response } from 'express';
import {
  createDatabase,
  createUser,
  setDatabaseSecurity,
  saveCodeRecord,
  getCodeRecord,
  databaseExists,
} from '../services/couchdb';
import * as cacheService from '../services/cacheService';

const router = Router();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generatePassword(length = 20): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pwd = '';
  for (let i = 0; i < length; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

function dbNameFromCode(code: string): string {
  return 'stod_' + code.toLowerCase().replace('-', '_');
}

// POST /api/sync/generate
router.post('/generate', async (_req: Request, res: Response) => {
  try {
    let code = generateCode();
    let dbName = dbNameFromCode(code);

    // Asegurar que el código no existe ya
    let attempts = 0;
    while (await databaseExists(dbName) && attempts < 10) {
      code = generateCode();
      dbName = dbNameFromCode(code);
      attempts++;
    }

    const username = `stod_user_${code.toLowerCase().replace('-', '')}`;
    const password = generatePassword();
    const syncUrl = `${process.env.COUCHDB_URL}/${dbName}`;

    await createDatabase(dbName);
    await createUser(username, password);
    await setDatabaseSecurity(dbName, username);
    await saveCodeRecord({ code, dbName, syncUrl, username, password, createdAt: new Date().toISOString() });

    // Cachear el nuevo código inmediatamente
    cacheService.set(`code_${code}`, { code, dbName, syncUrl, username, password }, 10 * 60 * 1000);

    res.json({ code, syncUrl, username, password });
  } catch (err) {
    console.error('[sync/generate]', err);
    res.status(500).json({ error: 'Error generando código de sincronización' });
  }
});

// POST /api/sync/connect
router.post('/connect', async (req: Request, res: Response) => {
  const { code } = req.body as { code?: string };

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Código requerido' });
    return;
  }

  try {
    const codeKey = code.toUpperCase().trim();

    // Verificar cache primero (TTL 10 min)
    let record = cacheService.get<any>(`code_${codeKey}`);

    if (!record) {
      record = await getCodeRecord(codeKey);
      if (record) {
        cacheService.set(`code_${codeKey}`, record, 10 * 60 * 1000);
      }
    }

    if (!record) {
      res.status(404).json({ error: 'Código no encontrado o expirado' });
      return;
    }

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
    res.json({
      code: record.code,
      syncUrl: record.syncUrl,
      username: record.username,
      password: record.password,
    });
  } catch (err) {
    console.error('[sync/connect]', err);
    res.status(500).json({ error: 'Error al conectar' });
  }
});

export default router;
