# STOD como SaaS multi-clínica — Diseño

**Fecha:** 2026-07-13
**Estado:** Investigación completa contra el código real, listo para convertir en plan de implementación.

## Contexto

STOD hoy funciona para la clínica del propio usuario. Este spec define qué falta
para venderlo a clínicas dentales ajenas en República Dominicana como SaaS
self-serve, verificado contra el código real (no memoria/supuestos).

## Lo que ya existe (verificado, no hay que reconstruirlo)

- Registro self-serve de clínicas nuevas vía Firebase Auth.
- Aislamiento de datos en dos capas: Firestore (`clinicId` scoping en
  `firestore.rules`) y CouchDB (una base de datos por clínica, con seguridad
  propia por DB en `backend/src/services/couchdb.ts`).
- Invitación de personal por código con roles y estado `pending`
  (`joinRequests.ts`).
- Branding propio por clínica (logo/firma/sello), aislado por ruta de storage.
- Trial de 14 días sin tarjeta (`initializeUserSubscription`,
  `TRIAL_DURATION_MS = 14 días`, `backend/src/services/subscription.ts`).
- Stripe Checkout Session real (`createCheckoutSession`,
  `backend/src/services/stripe.ts`) + webhooks reales de
  `subscription.created/updated/deleted` que actualizan el estado.
- Gate de acceso en frontend (`SubscriptionGate.tsx` +
  `useSubscription.ts`): lectura permitida en trial o pagado, escritura solo
  pagado, con `Paywall` y `TrialTimer` ya construidos.

## Flujo de activación de suscripción (sección prioritaria)

**Flujo actual, paso a paso, tal como existe en el código hoy:**

1. Usuario se registra (Firebase Auth) → se llama
   `POST /api/auth/initialize-subscription` → crea `subscriptions/{uid}` con
   `status: 'trial'`, `trialExpiresAt: ahora + 14 días`. **Sin tarjeta.**
2. Mientras el trial está activo: lectura permitida en toda la app, escritura
   bloqueada solo si el trial ya expiró y no hay pago.
3. Cuando la app necesita gatear algo (`SubscriptionGate` con
   `requiredFor="write"` o trial vencido), muestra el componente `Paywall`
   con un botón de upgrade — **no hay una página de precios dedicada, es un
   gate inline dentro de la app**, no un flujo de "elige tu plan" previo al
   registro.
4. Al hacer clic en upgrade: `POST /api/auth/create-checkout-session` →
   backend crea una Stripe Checkout Session (`mode: 'subscription'`) con
   `line_items: [{ price: process.env.STRIPE_PRODUCT_ID, quantity: 1 }]` →
   redirige a la página hospedada de Stripe.
5. Usuario paga en Stripe → Stripe dispara `subscription.created` → el
   webhook actualiza `subscriptions/{uid}.status = 'active'` → Stripe
   redirige de vuelta a `successUrl` (la misma página donde estaba) →
   `useSubscription` hace polling cada 30s y detecta el cambio → el gate se
   abre.
6. Pago fallido/cancelación: los webhooks `updated`/`deleted` actualizan el
   `status` (`past_due` sigue contando como pagado — es el grace period
   implícito de Stripe reintentando el cobro; `canceled` bloquea lectura y
   escritura).

**Gaps reales encontrados (verificados en código, no supuestos):**

1. **No hay selección de plan — solo un precio fijo.** `STRIPE_PRODUCT_ID`
   es una sola variable de entorno con un único Price ID de Stripe. No existe
   ningún concepto de "plan básico/pro/clínica grande" en el código. Para
   vender 2-3 tiers hace falta: (a) crear 2-3 Prices en Stripe, (b) una
   pantalla simple de selección de plan antes de `createCheckoutSession`, (c)
   pasar el `priceId` elegido al backend en vez de leerlo fijo del `.env`.
2. **Bug de arquitectura crítico para multi-clínica: la suscripción es por
   usuario (`uid`), no por clínica (`clinicId`).** `checkSubscriptionAccess`
   se llama con `req.uid` (`backend/src/middleware/subscription.ts:53`) — el
   uid del usuario logueado, no el dueño de la clínica. Si el dueño de una
   clínica paga pero invita personal (vía `joinRequests`), cada miembro del
   personal tiene su PROPIO documento `subscriptions/{staffUid}` que nunca se
   inicializó ni se pagó — quedarían bloqueados aunque la clínica sí pagó.
   **Esto hay que arreglarlo antes de vender a una clínica con más de un
   usuario**, que es el caso normal (dentista + asistente/recepción). Fix:
   `checkSubscriptionAccess` debe resolver el `clinicId` del usuario (ya
   existe ese mapeo en `admin.ts:80`, `isOwner ? u.uid : fsData?.clinicId`) y
   chequear la suscripción del dueño de la clínica, no la del usuario
   individual.
3. **No hay página de precios pública.** El paywall es un gate dentro de la
   app ya autenticada — no hay forma de que un visitante externo vea planes y
   precios antes de registrarse. Para vender activamente hace falta una
   landing con precios.
4. **Nada está desplegado a producción.** No hay URL pública — sin esto,
   nada de lo anterior importa, es el bloqueador #1 en la práctica.

## Facturación electrónica dominicana (e-CF)

La DGII exige e-CF obligatorio a partir del **15 de noviembre de 2026**
(prórroga vigente para micro/pequeñas empresas hasta esa fecha). Cualquier
clínica dominicana real va a pedir esto para operar legal — es un requisito
de producto, no algo opcional.

**Vía recomendada: integrar contra un PSFE (Proveedor de Servicios de
Facturación Electrónica) certificado por la DGII, no contra la DGII
directamente.** Certificarse como PSFE propio es un proceso pesado pensado
para quien va a facturar millones de comprobantes — no tiene sentido para
STOD. **Alanube** es el PSFE certificado que opera como motor técnico detrás
de Alegra en RD; ofrece integración vía API. Alegra mismo ya lo usa así para
sus clientes (incluyendo el competidor dental Dentidesk, que se integra con
Alegra para este mismo propósito). Integraciones API de este tipo se estiman
en 1-3 semanas de trabajo según proveedores del sector.

**Recomendación concreta:** integrar vía la API de Alanube (o de Alegra, que
la envuelve) en vez de perseguir certificación PSFE directa con la DGII.
Genera el e-CF (tipo E31/E32 según aplique a servicios) cuando se cobra una
suscripción o un servicio dentro de la app, firma/envía/resguarda vía el
proveedor, guarda la referencia del comprobante en Firestore junto al
registro de cobro correspondiente.

## Planes de precio (2-3 tiers)

Basado en el rango de mercado investigado (Doctocliq desde $19/mes,
Dentalink $29-400+/mes según tamaño, Dentidesk sin precio público):

| Plan | Precio sugerido | Para quién | Incluye |
|---|---|---|---|
| Básico | $25/mes | 1 dentista, sin personal adicional | Ficha de paciente, documentos profesionales, agenda |
| Clínica | $55/mes | 1-3 dentistas + personal de apoyo | Todo lo anterior + invitación de personal por rol + Denti (IA) |
| Clínica+ | $95/mes | Clínicas con 4+ profesionales | Todo lo anterior + soporte prioritario + branding avanzado |

Justificación: entra por debajo de Dentalink en el segmento de entrada
(compite en precio), por encima de Doctocliq (STOD ya trae IA y offline-first
que Doctocliq no necesariamente iguala) — posiciona a STOD como la opción
intermedia con mejor relación precio/capacidad para clínicas pequeñas-medianas
dominicanas, el segmento donde no hay jugador local dominante.

## Landing / pricing pública (mínimo viable)

Una sola página estática (puede vivir fuera del app shell actual, ej. Next.js
simple o incluso HTML estático servido por el mismo backend): propuesta de
valor en 2-3 líneas, tabla de los 3 planes, botón "Empezar prueba gratis de
14 días" que lleva al registro existente. No hace falta blog ni SEO
elaborado para el primer cliente — solo un lugar al que se pueda enviar un
link.

## Plan de salida al primer cliente ajeno

1. Deploy a producción (bloqueador técnico #1).
2. Arreglar el bug de suscripción por-clínica-no-por-usuario (bloqueador de
   producto — sin esto, cualquier clínica con personal se rompe).
3. Landing mínima con los 3 planes.
4. Integración e-CF vía Alanube/Alegra (puede lanzarse sin esto para el
   piloto informal, pero es requisito antes de vender a una clínica que
   exija comprobante fiscal real — probablemente la mayoría).
5. Outreach directo: 5-10 clínicas dentales pequeñas/medianas conocidas o
   referidas (no depender de tráfico orgánico para el primer cliente) — ofrecer
   el trial de 14 días ya existente como entrada sin fricción.

## Fuera de alcance de este spec

Selección de plan multi-tier en el checkout (documentado como gap, no
diseñado a nivel de código todavía — es la Fase 1 de un plan de
implementación futuro). Migración de datos de clínicas existentes de otros
sistemas. App móvil nativa.
