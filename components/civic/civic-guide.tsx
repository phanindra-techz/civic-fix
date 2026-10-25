'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, CheckCircle2, FileText, Languages, Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CATEGORIES, LANGUAGES, STATUS_META } from '@/lib/civic/data'
import { GUIDE_STRINGS, detectIntent } from '@/lib/civic/guide-i18n'
import type { IssueCategory, LanguageCode } from '@/lib/civic/types'
import { useCivic } from './civic-provider'
import { CATEGORY_ICONS, SectionHeading, SlaCountdown, StatusBadge } from './shared'

type Message =
  | { id: string; from: 'user'; text: string }
  | { id: string; from: 'bot'; kind: 'text'; text: string }
  | { id: string; from: 'bot'; kind: 'guide'; category: IssueCategory; lang: LanguageCode; text: string; done?: boolean }
  | { id: string; from: 'bot'; kind: 'ticket'; ticketId: string; text: string }

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const uid = () => Math.random().toString(36).slice(2, 10)

export function CivicGuide() {
  const { language, setLanguage, tickets, cityId, addTicket, setDraft, setView } = useCivic()
  const strings = GUIDE_STRINGS[language]
  const langMeta = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0]

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [listening, setListening] = useState(false)
  const [speak, setSpeak] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout)
      recognitionRef.current?.stop()
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    },
    [],
  )

  const myTickets = tickets.filter((t) => t.reporter === 'You' && t.city === cityId)

  function say(text: string) {
    if (!speak || typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = langMeta.speech
    window.speechSynthesis.speak(u)
  }

  function reply(msg: Message) {
    setTyping(true)
    timers.current.push(
      setTimeout(() => {
        setTyping(false)
        setMessages((prev) => [...prev, msg])
        if (msg.from === 'bot') say(msg.text)
      }, 700),
    )
  }

  function send(raw: string) {
    const text = raw.trim()
    if (!text) return
    setMessages((prev) => [...prev, { id: uid(), from: 'user', text }])
    setInput('')
    const intent = detectIntent(text)
    if (intent === 'track') {
      const latest = myTickets[0]
      if (!latest) {
        reply({ id: uid(), from: 'bot', kind: 'text', text: strings.noTicket })
      } else {
        reply({
          id: uid(),
          from: 'bot',
          kind: 'ticket',
          ticketId: latest.id,
          text: strings.track(latest.id, STATUS_META[latest.status].label),
        })
      }
      return
    }
    if (intent) {
      const meta = CATEGORIES[intent]
      reply({
        id: uid(),
        from: 'bot',
        kind: 'guide',
        category: intent,
        lang: language,
        text: `${strings.intro(strings.categories[intent])} ${strings.steps.join('. ')}. ${strings.dept(meta.department, meta.slaHours)}`,
      })
      return
    }
    reply({ id: uid(), from: 'bot', kind: 'text', text: strings.fallback })
  }

  function autofill(category: IssueCategory, lastUserText: string) {
    setDraft({ category, description: lastUserText })
    setView('report')
  }

  function submitNow(messageId: string, category: IssueCategory, lastUserText: string) {
    const ticket = addTicket({
      category,
      severity: category === 'waterlogging' ? 'High' : 'Medium',
      description: lastUserText || `${CATEGORIES[category].label} reported via CivicGuide AI.`,
      source: 'civicguide',
    })
    setMessages((prev) => prev.map((m) => (m.id === messageId && m.from === 'bot' && m.kind === 'guide' ? { ...m, done: true } : m)))
    reply({ id: uid(), from: 'bot', kind: 'ticket', ticketId: ticket.id, text: strings.submitted(ticket.id, ticket.department) })
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const Ctor = getRecognition()
    setListening(true)
    if (!Ctor) {
      timers.current.push(
        setTimeout(() => {
          setListening(false)
          send(strings.suggestions[1])
        }, 1800),
      )
      return
    }
    const rec = new Ctor()
    rec.lang = langMeta.speech
    rec.interimResults = false
    rec.continuous = false
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      if (transcript) send(transcript)
    }
    rec.onerror = () => {
      setListening(false)
      send(strings.suggestions[1])
    }
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    try {
      rec.start()
    } catch {
      setListening(false)
    }
  }

  function lastUserTextBefore(index: number) {
    for (let i = index - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.from === 'user') return m.text
    }
    return ''
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="Multilingual assistant"
        title="CivicGuide AI"
        description="Ask in English, Telugu, Hindi, Kannada, Tamil, Malayalam or Marathi — by text or voice. CivicGuide explains the process and can file the complaint for you."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-label="Chat with CivicGuide" className="flex h-[640px] flex-col overflow-hidden rounded-xl border bg-card lg:col-span-2">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <span className="relative flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="size-4" aria-hidden="true" />
              <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card bg-success" aria-hidden="true" />
            </span>
            <div className="flex flex-1 flex-col leading-tight">
              <span className="text-sm font-semibold">CivicGuide</span>
              <span className="text-xs text-muted-foreground">Responding in {langMeta.label}</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setSpeak((s) => !s)
                if (speak) window.speechSynthesis?.cancel()
              }}
              aria-pressed={speak}
              aria-label={speak ? 'Mute voice replies' : 'Read replies aloud'}
            >
              {speak ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
            </Button>
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4" aria-live="polite">
            <BotBubble>{strings.greeting}</BotBubble>

            {messages.map((m, i) => {
              if (m.from === 'user') {
                return (
                  <div key={m.id} className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                    {m.text}
                  </div>
                )
              }
              if (m.kind === 'text') return <BotBubble key={m.id}>{m.text}</BotBubble>
              if (m.kind === 'ticket') return <TicketBubble key={m.id} ticketId={m.ticketId} text={m.text} />
              const s = GUIDE_STRINGS[m.lang]
              const meta = CATEGORIES[m.category]
              const Icon = CATEGORY_ICONS[m.category]
              const userText = lastUserTextBefore(i)
              return (
                <BotBubble key={m.id}>
                  <div className="flex flex-col gap-3">
                    <p className="flex items-center gap-2 font-medium">
                      <Icon className="size-4 text-primary" aria-hidden="true" />
                      {s.intro(s.categories[m.category])}
                    </p>
                    <ol className="flex flex-col gap-2">
                      {s.steps.map((step, si) => (
                        <li key={step} className="flex gap-2">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                            {si + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="text-muted-foreground">{s.dept(meta.department, meta.slaHours)}</p>
                    {m.done ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        {s.submitted('', meta.department).split('!')[0]}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => submitNow(m.id, m.category, userText)}>
                          <Send data-icon="inline-start" aria-hidden="true" />
                          {s.submitNow}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => autofill(m.category, userText)}>
                          <FileText data-icon="inline-start" aria-hidden="true" />
                          {s.autofill}
                        </Button>
                      </div>
                    )}
                  </div>
                </BotBubble>
              )
            })}

            {typing ? (
              <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-sm bg-muted px-4 py-3" aria-label="CivicGuide is typing">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t p-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {strings.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="shrink-0 rounded-full border bg-background px-3 py-1 text-xs whitespace-nowrap transition-colors hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="flex items-center gap-2"
            >
              <Button
                type="button"
                variant={listening ? 'destructive' : 'outline'}
                size="icon"
                onClick={toggleMic}
                aria-pressed={listening}
                aria-label={listening ? 'Stop voice input' : `Speak in ${langMeta.label}`}
                className={cn(listening && 'animate-pulse')}
              >
                {listening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
                }}
                placeholder={listening ? strings.listening : strings.placeholder}
                aria-label="Message CivicGuide"
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send message">
                <Send aria-hidden="true" />
              </Button>
            </form>
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Languages className="size-4 text-primary" aria-hidden="true" />
              Choose your language
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  aria-pressed={l.code === language}
                  onClick={() => setLanguage(l.code)}
                  className={cn(
                    'flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    l.code === language ? 'border-primary bg-primary/10' : 'hover:bg-muted',
                  )}
                >
                  <span className="text-sm font-medium">{l.native}</span>
                  <span className="text-[11px] text-muted-foreground">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold">What CivicGuide can do</h2>
            <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Mic className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Voice input in 7 Indian languages
              </li>
              <li className="flex gap-2">
                <FileText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Auto-fill or directly file complaints for you
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Track ticket status with live SLA countdown
              </li>
              <li className="flex gap-2">
                <Volume2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Reads replies aloud for accessibility
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function BotBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex max-w-[88%] items-end gap-2 self-start">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Bot className="size-3.5" aria-hidden="true" />
      </span>
      <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

function TicketBubble({ ticketId, text }: { ticketId: string; text: string }) {
  const { tickets } = useCivic()
  const ticket = tickets.find((t) => t.id === ticketId)
  return (
    <BotBubble>
      <div className="flex flex-col gap-3">
        <p>{text}</p>
        {ticket ? (
          <div className="flex min-w-64 flex-col gap-2 rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold">{ticket.id}</span>
              <StatusBadge status={ticket.status} />
            </div>
            <span className="text-xs text-muted-foreground">{ticket.department}</span>
            <SlaCountdown ticket={ticket} />
          </div>
        ) : null}
      </div>
    </BotBubble>
  )
}
