# STOD - Sistema de Odontología

> Un solo servicio en Railway sirve tanto el frontend como el backend.
> No se usa Vercel ni ningún otro hosting externo.

---

## Desarrollo local

### 1. Backend (sirve también el frontend compilado)
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de CouchDB
npm install
npm run dev
```

### 2. Frontend (modo desarrollo con hot-reload)
```bash
cd frontend
cp .env.example .env
# Editar .env con tus credenciales de Firebase
npm install
npm run dev
```
Abrir: http://localhost:5173

> En desarrollo, el frontend apunta al backend en `http://localhost:3001`.
> Puedes setear `VITE_API_URL=http://localhost:3001` en `frontend/.env` si usas ambos a la vez.

---

## Despliegue en Railway (todo en uno)

### Paso 1: CouchDB en Railway
1. Railway → New Project → Deploy from image: `couchdb`
2. Variables de entorno:
   ```
   COUCHDB_USER=admin
   COUCHDB_PASSWORD=<contraseña-segura>
   ```
3. Agregar dominio público → anotar URL (ej: `https://couchdb-xxx.railway.app`)
4. Habilitar CORS: ir a `https://tu-couchdb.railway.app/_utils` → Config → CORS → Enable all origins

### Paso 2: App STOD en Railway (frontend + backend juntos)
1. Subir este repositorio a GitHub
2. Railway → New Project → Deploy from GitHub repo → seleccionar el repo
3. Variables de entorno del servicio:
   ```
   PORT=3001
   COUCHDB_URL=https://tu-couchdb.railway.app
   COUCHDB_ADMIN_USER=admin
   COUCHDB_ADMIN_PASS=<contraseña-de-couchdb>

   # Firebase (baked en el build del frontend)
   VITE_FIREBASE_API_KEY=tu-api-key
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu-proyecto
   VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```
4. Railway detecta el `nixpacks.toml` automáticamente y construye todo.
5. Agregar dominio público → esa URL es la app completa.

> Railway ejecuta `node backend/dist/index.js` el cual sirve la API en `/api/*`
> y el frontend compilado en todas las demás rutas.

---

## Sincronización entre dispositivos

### Dispositivo A (principal):
1. Ir a **Configuración** → sección "Sincronización"
2. Click en **"Generar código de conexión"**
3. Aparecerá un código como `DENT-X7K2`

### Dispositivo B:
1. Ir a **Configuración** → sección "Sincronización"
2. Ingresar el código `DENT-X7K2`
3. Click en **"Conectar"** → ambos dispositivos sincronizan automáticamente

---

## Instalar como app (PWA)

| Plataforma | Cómo instalar |
|------------|---------------|
| Android (Chrome) | Menú (⋮) → "Agregar a pantalla de inicio" |
| iPhone/iPad (Safari) | Compartir → "Añadir a pantalla de inicio" |
| PC/Mac (Chrome/Edge) | Ícono de instalación en barra de direcciones |

---

## Estructura del proyecto
```
STOD/
├── frontend/        # React + Vite + PWA (se compila a frontend/dist)
├── backend/         # Express + Node.js (sirve el frontend compilado)
└── nixpacks.toml    # Configuración de build para Railway
```
