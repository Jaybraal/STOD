'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const updated: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? data.error }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con Denti.' }])
    } finally {
      setLoading(false)
    }
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
            {messages.length === 0 && (
              <div className="text-center mt-4 space-y-2">
                <p className="text-xs text-slate-500">Hola, soy Denti.</p>
                <p className="text-[11px] text-slate-400">Puedo ayudarte con dudas sobre tratamientos, síntomas e higiene bucal.</p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-sky-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-700 rounded-bl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

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
