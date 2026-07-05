import { Router, Request, Response } from 'express';

const router = Router();

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function buildSystemPrompt(today: string): string {
  // "YYYY-MM-DD" parseado en UTC evita que el día calculado se corra por zona horaria.
  const weekday = WEEKDAYS[new Date(`${today}T00:00:00Z`).getUTCDay()];
  return `Eres Denti, el asistente IA de STOD (Sistema de Odontología).

Puedes ayudar con:
- Responder preguntas sobre tratamientos dentales
- Orientar sobre síntomas y cuándo buscar atención urgente
- Explicar procedimientos odontológicos en términos simples
- Dar consejos de higiene bucal
- Ayudar al equipo clínico con terminología y protocolos

También puedes ejecutar acciones en el sistema mediante herramientas:
- buscar_paciente: úsala para encontrar el ID de un paciente existente por nombre. Úsala siempre antes de crear_cita.
- crear_paciente / crear_cita: proponen una acción, pero el usuario debe confirmarla explícitamente en la interfaz antes de que se guarde nada. Después de llamarlas, espera el resultado antes de continuar.

REGLA ESTRICTA: si el usuario pide crear un paciente o agendar una cita, tu ÚNICA respuesta válida es llamar a la función correspondiente (tool call). NUNCA respondas con texto afirmando que creaste un paciente, agendaste una cita, o completaste cualquier acción del sistema — solo la interfaz puede confirmar que algo se guardó, después de que el usuario apruebe la tarjeta de confirmación. Si no tienes los datos suficientes para llamar a la función (por ejemplo falta el nombre del paciente), pregunta primero; no inventes ni asumas que ya se ejecutó.

Hoy es ${weekday}, ${today} (fecha local de la clínica). Usa el nombre del día para calcular correctamente fechas relativas ("mañana", "el lunes", "en 3 días") y conviértelas a formato YYYY-MM-DD antes de llamar una herramienta. No calcules el día de la semana de memoria: apóyate en que hoy es ${weekday}.

Responde siempre en español. Sé claro, empático y profesional.
Para cualquier diagnóstico real, siempre recomienda consultar con el odontólogo.`;
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'buscar_paciente',
      description:
        'Busca pacientes existentes por nombre o parte del nombre. Úsala antes de crear_cita para obtener el patientId.',
      parameters: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'Nombre o parte del nombre a buscar' },
        },
        required: ['nombre'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_paciente',
      description:
        'Propone crear un paciente nuevo. No se guarda hasta que el usuario confirme en la interfaz.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          dob: { type: 'string', description: 'Fecha de nacimiento YYYY-MM-DD' },
          address: { type: 'string' },
          allergies: { type: 'string' },
          medicalHistory: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_cita',
      description:
        'Propone agendar una cita para un paciente EXISTENTE (usa buscar_paciente primero para obtener patientId). No se guarda hasta que el usuario confirme en la interfaz.',
      parameters: {
        type: 'object',
        properties: {
          patientId: { type: 'string' },
          patientName: { type: 'string', description: 'Nombre del paciente, para mostrar en la confirmación' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          time: { type: 'string', description: 'HH:mm' },
          duration: { type: 'number', description: 'Duración en minutos, ej. 30' },
          reason: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['patientId', 'patientName', 'date', 'time', 'reason'],
      },
    },
  },
];

interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

async function callGroq(
  messages: unknown[],
  retrying = false
): Promise<{ choices: { message: { content: string | null; tool_calls?: ToolCall[] } }[] }> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 800,
      tools: TOOLS,
      tool_choice: 'auto',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    // El modelo a veces genera una llamada a función mal formada (tool_use_failed).
    // Es transitorio: un solo reintento suele resolverlo sin exponer el error al usuario.
    if (!retrying) {
      let code: string | undefined;
      try {
        code = JSON.parse(err)?.error?.code;
      } catch {
        // respuesta no era JSON, se ignora y se reintenta igual solo si aplica el status
      }
      if (code === 'tool_use_failed') {
        return callGroq(messages, true);
      }
    }
    throw new Error(`Groq ${res.status}: ${err}`);
  }
  return res.json();
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, today } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages requerido' });
    }

    const todayStr = typeof today === 'string' && today ? today : new Date().toISOString().slice(0, 10);
    const full = [{ role: 'system', content: buildSystemPrompt(todayStr) }, ...messages];
    const data = await callGroq(full);
    const msg = data.choices[0]?.message;
    res.json({ reply: msg?.content ?? '', toolCalls: msg?.tool_calls ?? null });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    console.error('[/api/chat]', msg);
    res.status(500).json({ error: 'Error con el servicio de IA' });
  }
});

export default router;
