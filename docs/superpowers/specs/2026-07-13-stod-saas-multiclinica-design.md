# STOD como SaaS multi-clínica — Diseño

**Fecha:** 2026-07-13
**Estado:** Investigación completa contra el código real, listo para convertir en plan de implementación.

## Contexto

STOD hoy funciona para la clínica del propio usuario. Este spec define qué falta
para venderlo a clínicas ajenas en República Dominicana como SaaS self-serve,
verificado contra el código real (no memoria/supuestos).

**Corrección de posicionamiento (13/07/26):** una versión anterior de este spec
enmarcó STOD como un producto dental. Es incorrecto — **STOD ya es un sistema
general para cualquier tipo de clínica**, no solo dental. Verificado en el
código: `ClinicType` (`frontend/src/db/schemas.ts:107-114`) ya incluye `dental`,
`medicina`, `psicologia`, `fisioterapia`, `nutricion`, `veterinaria`, `otro`,
cada uno con sus propios campos de tratamiento por defecto
(`DEFAULT_TREATMENT_FIELDS`, `frontend/src/utils/constants.ts:99-132` — ej.
psicología trae "N.º de sesión"/"Modalidad", veterinaria trae
"Especie"/"Raza", fisioterapia trae "Zona corporal"). El modelo de datos del
paciente y del tratamiento (`Patient`, `Treatment` con `customData`) es
genérico por diseño. Dental es una especialidad más entre siete ya
soportadas, no el producto entero — el mercado objetivo (TAM) es clínicas de
cualquier especialidad, no solo dentistas.

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

## Generalización de producto — gaps reales encontrados (13/07/26)

El modelo de datos y configuración YA son multi-especialidad (ver arriba) —
no hace falta rediseño de producto. Pero hay 3 puntos cosméticos/de branding
con supuestos dentales incrustados que sí hay que corregir antes de vender a
una clínica no-dental, porque se le mostrarían textualmente a ese cliente:

1. **El asistente IA "Denti" está 100% hardcodeado a odontología**
   (`backend/src/routes/chat.ts:7-29`, función `buildSystemPrompt`). El
   prompt dice literalmente "Eres Denti, el asistente IA de STOD (Sistema de
   Odontología)", "tratamientos dentales", "procedimientos odontológicos",
   "higiene bucal", "consultar con el odontólogo" — y solo recibe `today`
   como parámetro, sin el `clinicType` de la clínica. Fix: parametrizar
   `buildSystemPrompt(today, clinicType)` y generar la sección de
   capacidades/tono según el tipo de clínica (reusar
   `DEFAULT_TREATMENT_FIELDS`/`CLINIC_TYPE_OPTIONS` ya existentes como fuente
   de verdad de qué dice cada especialidad). Esfuerzo: pequeño, es una
   función pura.
2. **El pie de página de todo documento clínico impreso dice "Sistema de
   Odontología" sin importar la especialidad** (`frontend/src/pages/Documentos/DocumentoPrint.tsx:80`).
   Una constancia médica o un reporte de fisioterapia saldría con ese texto
   dental abajo. Fix: usar un texto de marca neutral ("STOD — Sistema de
   Gestión Clínica") o condicionar al `clinicType` de la clínica.
3. **Placeholder de ejemplo en el formulario de citas** (`frontend/src/pages/Citas/CitaForm.tsx:146`,
   "Limpieza dental, extracción...") — cosmético, trivial de generalizar o
   hacer dinámico por `clinicType`.

Ninguno de los tres es un bloqueador de arquitectura — son ajustes de texto/prompt,
no de modelo de datos. Se pueden resolver en una sola tarea corta antes del
lanzamiento a clínicas no-dentales.

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

## Mercado y competencia (corregido — clínicas en general, no solo dental)

Con el TAM correcto (cualquier especialidad), el panorama de competencia se
amplía más allá de los jugadores dentales ya identificados (Dentidesk,
Dentalink, Doctocliq — Doctocliq de hecho ya se anuncia como "software dental
y médico", o sea multi-especialidad igual que STOD):

- **DriCloud** — multi-especialidad, "desde un solo profesional hasta una
  gran clínica", incluye facturación electrónica y telemedicina.
- **Medesk** — apunta a clínicas medianas multi-especialidad (4-20
  profesionales), planes escalables.
- **OpenEMR-LatAm** — historia clínica electrónica open-source con soporte
  regional, **disponible específicamente para República Dominicana** —
  competidor directo a vigilar (barrera de precio baja al ser open-source).
- **AgendaPro** — uno de los favoritos en LatAm para clínicas/consultorios en
  general, fuerte en agenda/facilidad de uso.
- Referencia internacional por especialidad (no LatAm, pero marca el techo de
  precio): SimplePractice (EEUU) domina terapia/psicología a $49-99/mes por
  profesional con flujos específicos de salud mental.

Ningún jugador — dental o general — domina el mercado dominicano
específicamente. Sigue siendo terreno abierto localmente.

## Planes de precio (2-3 tiers)

Basado en el rango de mercado investigado, ahora con marco de referencia
general (Doctocliq desde $19/mes, DriCloud/Medesk/AgendaPro sin precio
público consistente, Dentalink $29-400+/mes según tamaño como techo de
referencia regional):

| Plan | Precio sugerido | Para quién | Incluye |
|---|---|---|---|
| Básico | $25/mes | 1 profesional, sin personal adicional | Ficha de paciente (cualquier especialidad), documentos profesionales, agenda |
| Clínica | $55/mes | 1-3 profesionales + personal de apoyo | Todo lo anterior + invitación de personal por rol + Denti (IA, generalizada por especialidad) |
| Clínica+ | $95/mes | Clínicas con 4+ profesionales | Todo lo anterior + soporte prioritario + branding avanzado |

Justificación: entra por debajo de Dentalink/Medesk en el segmento de entrada
(compite en precio), por encima de Doctocliq (STOD ya trae IA y
offline-first) — posiciona a STOD como la opción intermedia con mejor
relación precio/capacidad para clínicas pequeñas-medianas dominicanas de
**cualquier especialidad**, el segmento donde no hay jugador local
dominante. El mensaje de venta ya no es "software para dentistas" sino
"software de gestión clínica que se adapta a tu especialidad" — la
selección de `clinicType` en el onboarding es el gancho de ese mensaje.

## Landing / pricing pública (mínimo viable)

Una sola página estática (puede vivir fuera del app shell actual, ej. Next.js
simple o incluso HTML estático servido por el mismo backend): propuesta de
valor en 2-3 líneas **que mencione explícitamente que se adapta a la
especialidad** (no "para dentistas"), selector visual de los 7 tipos de
clínica ya soportados (mismo set de `CLINIC_TYPE_OPTIONS`, con sus emojis,
como prueba social de que no es una herramienta genérica sin pensar —
reafirma justo lo contrario), tabla de los 3 planes, botón "Empezar prueba
gratis de 14 días" que lleva al registro existente. No hace falta blog ni SEO
elaborado para el primer cliente — solo un lugar al que se pueda enviar un
link.

## Plan de salida al primer cliente ajeno

1. Deploy a producción (bloqueador técnico #1).
2. Arreglar el bug de suscripción por-clínica-no-por-usuario (bloqueador de
   producto — sin esto, cualquier clínica con personal se rompe).
3. Resolver los 3 gaps de generalización (sección arriba) — Denti, pie de
   documento, placeholder — antes de mostrarle el producto a una clínica
   no-dental.
4. Landing mínima con los 3 planes y el mensaje de "cualquier especialidad".
5. Integración e-CF vía Alanube/Alegra (puede lanzarse sin esto para el
   piloto informal, pero es requisito antes de vender a una clínica que
   exija comprobante fiscal real — probablemente la mayoría).
6. Outreach directo: 5-10 clínicas pequeñas/medianas conocidas o referidas —
   **diversifica el primer lote entre especialidades** (ej. 2 dentales, 2
   médicas/psicología, 1 fisioterapia o veterinaria) en vez de solo dentistas,
   para validar de verdad el posicionamiento general y encontrar temprano
   cualquier gap de generalización que no se haya visto en el código. No
   depender de tráfico orgánico para el primer cliente — ofrecer el trial de
   14 días ya existente como entrada sin fricción.

## Fuera de alcance de este spec

Selección de plan multi-tier en el checkout (documentado como gap, no
diseñado a nivel de código todavía — es la Fase 1 de un plan de
implementación futuro). Migración de datos de clínicas existentes de otros
sistemas. App móvil nativa.
