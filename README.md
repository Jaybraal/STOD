# STOD — Sistema de gestión odontológica

SaaS multi-tenant para consultorios dentales, diseñado bajo una restricción que
condiciona toda la arquitectura: **tiene que funcionar sin internet.**

> En una clínica, la conexión se cae y el paciente sigue en el sillón. Si el
> sistema depende de la red, el trabajo se detiene. STOD escribe siempre contra
> una base local y sincroniza cuando hay señal.

## Offline-first, no "con modo offline"

La diferencia no es cosmética. En lugar de una caché de lectura sobre una API,
el frontend escribe contra **PouchDB en el navegador** y replica contra
**CouchDB** cuando hay conexión. La aplicación no distingue entre estar online u
offline: escribe local siempre. La sincronización es un proceso aparte, con
resolución de conflictos y una barra de estado visible para el usuario
(`SyncStatusBar`).

Esto permite registrar pacientes, citas y tratamientos con la red caída y que
todo aparezca al reconectar, sin que nadie tenga que reintroducir nada.

## Módulos

- **Pacientes** — historia clínica, documentos asociados.
- **Citas** — agenda con `react-big-calendar`.
- **Tratamientos** — planes y seguimiento.
- **Documentos** — generación de documentos clínicos.
- **Configuración** y **Superadmin** — gestión multi-tenant.
- **Suscripción** — checkout con Stripe, periodo de prueba y control de acceso
  (`Paywall`, `SubscriptionGate`, `TrialTimer`).
- **Asistente** — chat de apoyo integrado.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React · TypeScript · Vite · Tailwind · Headless UI |
| Datos | PouchDB (navegador) ⇄ CouchDB (servidor) |
| API | Express |
| Pagos | Stripe |
| Distribución | PWA · Tauri (escritorio) |
| Despliegue | Docker · Railway |

## Decisiones de diseño

- **PouchDB/CouchDB sobre SQL** — la replicación bidireccional con resolución de
  conflictos viene resuelta por el protocolo, en lugar de reimplementarla.
- **`pouchdb-browser` en el frontend** — el paquete `pouchdb` completo arrastra
  dependencias de Node que rompen el build de Vite.
- **PWA + Tauri desde el mismo código** — misma base para navegador y escritorio.

## Licencia

Propietario — todos los derechos reservados. Visible para evaluación técnica;
no se autoriza su uso, copia ni distribución. Ver [LICENSE](LICENSE).
