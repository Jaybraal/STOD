# STOD - Sistema de Odontología

## Iniciar en desarrollo

### 1. Frontend
```bash
cd frontend
cp .env.example .env
# Editar .env y poner la URL del backend si ya está desplegado
npm run dev
```
Abrir: http://localhost:5173

### 2. Backend (solo necesario para sincronización entre dispositivos)
```bash
cd backend
cp .env.example .env
# Editar .env con las credenciales de CouchDB
npm run dev
```

---

## Despliegue en producción

### Paso 1: CouchDB en Railway
1. Ir a railway.app → New Project → Deploy from image: `couchdb`
2. Variables de entorno en Railway:
   - `COUCHDB_USER=admin`
   - `COUCHDB_PASSWORD=<contraseña-segura>`
3. Agregar dominio público → anotar la URL (ej: `https://couchdb-xxx.railway.app`)
4. Habilitar CORS en CouchDB:
   - Ir a `https://tu-couchdb.railway.app/_utils` → Config → CORS → Enable all origins

### Paso 2: Backend en Railway
1. Subir la carpeta `backend/` a un repositorio de GitHub
2. Railway → New Project → Deploy from GitHub repo
3. Variables de entorno:
   ```
   COUCHDB_URL=https://tu-couchdb.railway.app
   COUCHDB_ADMIN_USER=admin
   COUCHDB_ADMIN_PASS=<contraseña-de-couchdb>
   FRONTEND_URL=https://tu-frontend.vercel.app
   PORT=3001
   ```
4. Anotar la URL del backend (ej: `https://stod-backend-xxx.railway.app`)

### Paso 3: Frontend en Vercel
1. Subir la carpeta `frontend/` a GitHub
2. Vercel → New Project → Import desde GitHub
3. Variable de entorno:
   ```
   VITE_API_URL=https://stod-backend-xxx.railway.app
   ```
4. Deploy → obtener URL pública

---

## Uso del sistema de sincronización

### Dispositivo A (principal):
1. Ir a **Configuración** → sección "Sincronización"
2. Click en **"Generar código de conexión"**
3. Aparecerá un código como `DENT-X7K2`

### Dispositivo B:
1. Ir a **Configuración** → sección "Sincronización"
2. Ingresar el código `DENT-X7K2` en el campo de texto
3. Click en **"Conectar"**
4. Ambos dispositivos comenzarán a sincronizar automáticamente

---

## Instalar como app (PWA)

### Android (Chrome):
- Abrir en Chrome → Menú (⋮) → "Agregar a pantalla de inicio"

### iPhone/iPad (Safari):
- Abrir en Safari → Compartir → "Añadir a pantalla de inicio"

### PC/Mac (Chrome/Edge):
- Ícono de instalación en la barra de direcciones → "Instalar"

---

## Estructura del proyecto
```
STOD/
├── frontend/    # App React + PWA
└── backend/     # API Node.js de sincronización
```
