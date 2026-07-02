// Script para crear el superadmin en Firestore
// Uso: node setup-superadmin.mjs TU_CONTRASEÑA

const API_KEY    = 'AIzaSyCuqanBM7J6bLOPBF3Qh1ekifjxyJctZtY';
const PROJECT_ID = 'stod-383f1';
const EMAIL      = 'branelm15@gmail.com';
const UID        = 'RESKS8ugyVMK9iIpdjFOyFbA9XF3';

const password = process.argv[2];
if (!password) {
  console.error('Uso: node setup-superadmin.mjs TU_CONTRASEÑA');
  process.exit(1);
}

// 1. Login
const loginRes = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password, returnSecureToken: true }),
  }
);
const loginData = await loginRes.json();

if (loginData.error) {
  console.error('Login fallido:', loginData.error.message);
  process.exit(1);
}

console.log('Login exitoso. UID:', loginData.localId);
const token = loginData.idToken;

// 2. Escribir doc superadmins/{uid}
const fsRes = await fetch(
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/superadmins/${UID}`,
  {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: { email: { stringValue: EMAIL } }
    }),
  }
);
const fsData = await fsRes.json();

if (fsData.name) {
  console.log('✓ Superadmin creado exitosamente en Firestore.');
  console.log('  Documento:', fsData.name);
} else {
  console.error('Error en Firestore:', fsData.error?.message);
}
