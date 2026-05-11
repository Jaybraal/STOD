import { Router, Request, Response } from 'express';

const router = Router();

const SYSTEM_PROMPT = `Eres Denti, el asistente IA de STOD (Sistema de Odontología).

Puedes ayudar con:
- Responder preguntas sobre tratamientos dentales
- Orientar sobre síntomas y cuándo buscar atención urgente
- Explicar procedimientos odontológicos en términos simples
- Dar consejos de higiene bucal
- Ayudar al equipo clínico con terminología y protocolos

Responde siempre en español. Sé claro, empático y profesional.
Para cualquier diagnóstico real, siempre recomienda consultar con el odontólogo.`;

async function callGroq(messages: unknown[]) {
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
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }
  return res.json() as Promise<{ choices: { message: { content: string } }[] }>;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages requerido' });
    }

    const full = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];
    const data = await callGroq(full);
    res.json({ reply: data.choices[0]?.message?.content ?? '' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    console.error('[/api/chat]', msg);
    res.status(500).json({ error: 'Error con el servicio de IA' });
  }
});

export default router;
