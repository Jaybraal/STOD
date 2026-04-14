import { Router, type Request, type Response } from 'express';
import * as admin from 'firebase-admin';

const SUPERADMIN_UID = 'RESKS8ugyVMK9iIpdjFOyFbA9XF3';

// Inicializar Firebase Admin (solo una vez)
if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    // Railway puede expandir \n a saltos de línea reales dentro del JSON — los revertimos
    let parsed: object;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = JSON.parse(raw.replace(/\n/g, '\\n'));
    }
    admin.initializeApp({ credential: admin.credential.cert(parsed as admin.ServiceAccount) });
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
}

const router = Router();

// Middleware: solo el superadmin puede usar estas rutas
async function requireSuperAdmin(req: Request, res: Response, next: () => void) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'Token requerido' }); return; }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    if (decoded.uid !== SUPERADMIN_UID) {
      res.status(403).json({ error: 'Acceso denegado' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// GET /api/admin/users — listar todos los usuarios de Firebase Auth
router.get('/users', requireSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await admin.auth().listUsers(1000);
    const db = admin.firestore();

    // Leer todos los docs de users (miembros) para enriquecer con clinicId y rol
    const usersSnap = await db.collection('users').get();
    const firestoreMap = new Map<string, Record<string, unknown>>();
    usersSnap.forEach((d: admin.firestore.QueryDocumentSnapshot) => firestoreMap.set(d.id, d.data()));

    // Leer todas las clínicas para saber el nombre del owner
    const clinicsSnap = await db.collection('clinics').get();
    const clinicNames = new Map<string, string>();
    for (const clinicDoc of clinicsSnap.docs) {
      try {
        const configDoc = await db
          .collection('clinics')
          .doc(clinicDoc.id)
          .collection('config')
          .doc('clinic')
          .get();
        if (configDoc.exists) {
          const data = configDoc.data();
          clinicNames.set(clinicDoc.id, (data?.clinicName as string) || '');
        }
      } catch { /* ignorar */ }
    }

    const users = result.users.map((u: admin.auth.UserRecord) => {
      const fsData = firestoreMap.get(u.uid);
      const isOwner = !fsData; // owners no tienen doc en users
      const clinicId = isOwner ? u.uid : (fsData?.clinicId as string | undefined);
      return {
        uid: u.uid,
        email: u.email || '',
        createdAt: u.metadata.creationTime,
        isOwner,
        clinicId: clinicId || null,
        clinicName: clinicId ? (clinicNames.get(clinicId) || '') : '',
        role: fsData?.role || (isOwner ? 'owner' : 'member'),
        status: fsData?.status || 'active',
      };
    });

    res.json({ users });
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

// POST /api/admin/users — crear nuevo usuario (owner de clínica)
router.post('/users', requireSuperAdmin, async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ error: 'email y password son requeridos' });
    return;
  }
  try {
    const user = await admin.auth().createUser({ email, password });
    res.json({ uid: user.uid, email: user.email });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code || '';
    const msg =
      code === 'auth/email-already-exists' ? 'Ya existe un usuario con ese email' :
      code === 'auth/invalid-password'     ? 'La contraseña debe tener al menos 6 caracteres' :
      code === 'auth/invalid-email'        ? 'Email inválido' :
      'Error al crear usuario';
    res.status(400).json({ error: msg });
  }
});

// DELETE /api/admin/users/:uid — eliminar usuario de Firebase Auth + Firestore
router.delete('/users/:uid', requireSuperAdmin, async (req: Request, res: Response) => {
  const uid = req.params['uid'] as string;
  if (uid === SUPERADMIN_UID) {
    res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    return;
  }
  try {
    const db = admin.firestore();
    // Eliminar de Auth
    await admin.auth().deleteUser(uid);
    // Eliminar doc de Firestore si existe
    const userDoc = db.collection('users').doc(uid);
    const snap = await userDoc.get();
    if (snap.exists) await userDoc.delete();
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/delete]', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// PUT /api/admin/users/:uid — actualizar email o contraseña
router.put('/users/:uid', requireSuperAdmin, async (req: Request, res: Response) => {
  const uid = req.params['uid'] as string;
  const { email, password } = req.body as { email?: string; password?: string };
  try {
    const update: admin.auth.UpdateRequest = {};
    if (email)    update.email    = email;
    if (password) update.password = password;
    await admin.auth().updateUser(uid, update);
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/update]', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

export default router;
