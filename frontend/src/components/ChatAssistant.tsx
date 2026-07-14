'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Check } from 'lucide-react'
import { usePatients, usePatientMutations } from '../hooks/usePatients'
import { useAppointmentMutations } from '../hooks/useAppointments'
import { useConfig } from '../hooks/useConfig'

interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface ProtocolMessage {
  role: 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

type DisplayItem =
  | { type: 'bubble'; role: 'user' | 'assistant'; content: string }
  | {
      type: 'confirm'
      tool: 'crear_paciente' | 'crear_cita'
      args: Record<string, unknown>
      toolCallId: string
      status: 'pending' | 'confirmed' | 'cancelled'
    }

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const MAX_TOOL_ROUNDTRIPS = 4

const TOOL_LABELS: Record<string, string> = {
  crear_paciente: 'Denti quiere crear un paciente',
  crear_cita: 'Denti quiere agendar una cita',
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<ProtocolMessage[]>([])
  const [items, setItems] = useState<DisplayItem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { patients } = usePatients()
  const { createPatient } = usePatientMutations()
  const { createAppointment } = useAppointmentMutations()
  const { config } = useConfig()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items, loading])

  async function callChat(nextHistory: ProtocolMessage[]) {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: nextHistory, today, clinicType: config?.clinicType }),
    })
    return res.json() as Promise<{ reply: string; toolCalls: ToolCall[] | null; error?: string }>
  }

  function buscarPaciente(nombre: string) {
    const q = nombre.trim().toLowerCase()
    return patients
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(p => ({ id: p._id, name: p.name, phone: p.phone }))
  }

  // Ejecuta turnos con el modelo, resolviendo buscar_paciente automáticamente
  // y deteniéndose para pedir confirmación humana en acciones de escritura.
  async function runTurn(nextHistory: ProtocolMessage[], depth = 0) {
    if (depth >= MAX_TOOL_ROUNDTRIPS) {
      setItems(prev => [...prev, { type: 'bubble', role: 'assistant', content: 'No pude completar la acción, intenta de nuevo.' }])
      setLoading(false)
      return
    }

    const data = await callChat(nextHistory)
    if (data.error && !data.toolCalls) {
      setItems(prev => [...prev, { type: 'bubble', role: 'assistant', content: data.error ?? 'Error con el servicio de IA' }])
      setLoading(false)
      return
    }

    const assistantMsg: ProtocolMessage = {
      role: 'assistant',
      content: data.reply ?? '',
      ...(data.toolCalls ? { tool_calls: data.toolCalls } : {}),
    }
    const historyWithAssistant = [...nextHistory, assistantMsg]
    setHistory(historyWithAssistant)

    if (data.reply) {
      setItems(prev => [...prev, { type: 'bubble', role: 'assistant', content: data.reply }])
    }

    const call = data.toolCalls?.[0]
    if (!call) {
      setLoading(false)
      return
    }

    if (call.function.name === 'buscar_paciente') {
      let results: ReturnType<typeof buscarPaciente> = []
      try {
        const args = JSON.parse(call.function.arguments)
        results = buscarPaciente(args.nombre ?? '')
      } catch {
        // argumentos inválidos del modelo, se reporta vacío
      }
      const toolMsg: ProtocolMessage = {
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify({ results }),
      }
      const historyWithTool = [...historyWithAssistant, toolMsg]
      setHistory(historyWithTool)
      await runTurn(historyWithTool, depth + 1)
      return
    }

    if (call.function.name === 'crear_paciente' || call.function.name === 'crear_cita') {
      const tool = call.function.name
      try {
        const args = JSON.parse(call.function.arguments)
        setItems(prev => [
          ...prev,
          { type: 'confirm', tool, args, toolCallId: call.id, status: 'pending' },
        ])
      } catch {
        const toolMsg: ProtocolMessage = {
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify({ success: false, message: 'Argumentos inválidos.' }),
        }
        await runTurn([...historyWithAssistant, toolMsg], depth + 1)
        return
      }
      setLoading(false)
      return
    }

    setLoading(false)
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ProtocolMessage = { role: 'user', content: text }
    const nextHistory = [...history, userMsg]
    setHistory(nextHistory)
    setItems(prev => [...prev, { type: 'bubble', role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      await runTurn(nextHistory)
    } catch {
      setItems(prev => [...prev, { type: 'bubble', role: 'assistant', content: 'Error al conectar con Denti.' }])
      setLoading(false)
    }
  }

  async function handleConfirm(index: number) {
    const item = items[index]
    if (item.type !== 'confirm') return
    setLoading(true)

    let toolResult: Record<string, unknown>
    try {
      if (item.tool === 'crear_paciente') {
        const a = item.args as Record<string, string>
        const created = await createPatient({
          name: a.name ?? '',
          dob: a.dob ?? '',
          phone: a.phone ?? '',
          email: a.email ?? '',
          address: a.address ?? '',
          allergies: a.allergies ?? '',
          medicalHistory: a.medicalHistory ?? '',
          notes: a.notes ?? '',
          hasInsurance: false,
          insuranceProvider: '',
        })
        toolResult = { success: true, patientId: created._id }
      } else {
        const a = item.args as Record<string, string | number>
        await createAppointment({
          patientId: String(a.patientId ?? ''),
          date: String(a.date ?? ''),
          time: String(a.time ?? ''),
          duration: Number(a.duration) || 30,
          reason: String(a.reason ?? ''),
          status: 'programada',
          notes: String(a.notes ?? ''),
        })
        toolResult = { success: true }
      }
    } catch (e) {
      toolResult = { success: false, message: e instanceof Error ? e.message : 'Error al guardar' }
    }

    setItems(prev => prev.map((it, i) => (i === index ? { ...it, status: 'confirmed' } : it)))
    const toolMsg: ProtocolMessage = { role: 'tool', tool_call_id: item.toolCallId, content: JSON.stringify(toolResult) }
    const nextHistory = [...history, toolMsg]
    setHistory(nextHistory)
    await runTurn(nextHistory)
  }

  async function handleCancel(index: number) {
    const item = items[index]
    if (item.type !== 'confirm') return
    setItems(prev => prev.map((it, i) => (i === index ? { ...it, status: 'cancelled' } : it)))
    setLoading(true)
    const toolMsg: ProtocolMessage = {
      role: 'tool',
      tool_call_id: item.toolCallId,
      content: JSON.stringify({ success: false, message: 'El usuario canceló la acción.' }),
    }
    const nextHistory = [...history, toolMsg]
    setHistory(nextHistory)
    await runTurn(nextHistory)
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-sky-600 text-white flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={15} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold leading-none">Denti</p>
              <p className="text-[10px] text-sky-200 mt-0.5">Asistente IA · STOD</p>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-70 transition-opacity">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-80">
            {items.length === 0 && (
              <div className="text-center mt-4 space-y-2">
                <p className="text-xs text-slate-500">Hola, soy Denti.</p>
                <p className="text-[11px] text-slate-400">Puedo ayudarte con dudas sobre tratamientos, síntomas e higiene bucal, y también crear pacientes o citas si me lo pides.</p>
              </div>
            )}

            {items.map((item, i) => {
              if (item.type === 'bubble') {
                return (
                  <div key={i} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                      item.role === 'user'
                        ? 'bg-sky-600 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-700 rounded-bl-none'
                    }`}>
                      {item.content}
                    </div>
                  </div>
                )
              }

              const a = item.args
              return (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-2">
                  <p className="font-semibold text-amber-800">{TOOL_LABELS[item.tool]}</p>
                  <ul className="text-slate-600 space-y-0.5">
                    {item.tool === 'crear_paciente' && (
                      <>
                        <li>Nombre: {String(a.name ?? '—')}</li>
                        {a.phone ? <li>Teléfono: {String(a.phone)}</li> : null}
                        {a.notes ? <li>Notas: {String(a.notes)}</li> : null}
                      </>
                    )}
                    {item.tool === 'crear_cita' && (
                      <>
                        <li>Paciente: {String(a.patientName ?? '—')}</li>
                        <li>Fecha: {String(a.date ?? '—')} {String(a.time ?? '')}</li>
                        <li>Motivo: {String(a.reason ?? '—')}</li>
                      </>
                    )}
                  </ul>
                  {item.status === 'pending' ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleConfirm(i)}
                        className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-medium"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => handleCancel(i)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <p className={`flex items-center gap-1 text-[11px] ${item.status === 'confirmed' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {item.status === 'confirmed' ? (<><Check size={12} /> Guardado</>) : 'Cancelado'}
                    </p>
                  )}
                </div>
              )
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 px-3 py-2.5 rounded-xl rounded-bl-none">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-100 flex-shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Escríbele a Denti..."
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-sky-500 text-slate-700 placeholder-slate-400"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="p-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 sm:right-6 z-50 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl shadow-lg shadow-sky-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ width: 52, height: 52 }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  )
}
