'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import {
  CAMERAS,
  CATEGORIES,
  CITIES,
  DEMO_ANCHOR,
  HOUR,
  LOWER_DIVISION,
  VIOLATION_META,
  createRng,
  generateAllTickets,
  makeTicket,
  randomAddress,
  randomCoords,
  randomPlate,
} from '@/lib/civic/data'
import type {
  AppNotification,
  CityId,
  DetectionEvent,
  IssueCategory,
  LanguageCode,
  ReportDraft,
  Role,
  Severity,
  Ticket,
  TicketStatus,
  ViewId,
} from '@/lib/civic/types'

let loadedAt: number | null = null
let cachedNow: number | null = null
const listeners = new Set<() => void>()
let tickerId: ReturnType<typeof setInterval> | null = null

function subscribeClock(listener: () => void) {
  listeners.add(listener)
  if (!tickerId) {
    tickerId = setInterval(() => {
      cachedNow = Date.now()
      listeners.forEach((l) => l())
    }, 1000)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && tickerId) {
      clearInterval(tickerId)
      tickerId = null
    }
  }
}

function getClockSnapshot() {
  if (cachedNow === null) cachedNow = Date.now()
  if (loadedAt === null) loadedAt = cachedNow
  return cachedNow
}

function getServerClockSnapshot() {
  return null
}

export interface NewTicketInput {
  category: IssueCategory
  severity: Severity
  description: string
  address?: string
  lat?: number
  lng?: number
  imageUrl?: string
  source: Ticket['source']
}

interface CivicContextValue {
  role: Role
  setRole: (role: Role) => void
  view: ViewId
  setView: (view: ViewId) => void
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  cityId: CityId
  setCityId: (city: CityId) => void
  now: number | null
  fastForward: (hours: number) => void
  tickets: Ticket[]
  cityTickets: Ticket[]
  addTicket: (input: NewTicketInput) => Ticket
  updateTicketStatus: (id: string, status: TicketStatus, note?: string) => void
  detections: DetectionEvent[]
  reviewDetection: (id: string, decision: 'approved' | 'rejected') => DetectionEvent | undefined
  notifications: AppNotification[]
  notify: (n: Omit<AppNotification, 'id' | 'at' | 'read'>) => void
  markAllRead: () => void
  draft: ReportDraft | null
  setDraft: (draft: ReportDraft | null) => void
  feedsLive: boolean
  setFeedsLive: (live: boolean) => void
}

const CivicContext = createContext<CivicContextValue | null>(null)

function seedDetections(cityId: CityId): DetectionEvent[] {
  const rng = createRng(42 + cityId.length)
  const city = CITIES[cityId]
  const events: DetectionEvent[] = []
  CAMERAS.forEach((cam, ci) => {
    cam.boxes.forEach((box, bi) => {
      const meta = VIOLATION_META[box.type]
      events.push({
        id: `DET-${city.code}-${ci}${bi}${Math.floor(rng() * 900 + 100)}`,
        cameraId: cam.id,
        cameraName: cam.name,
        image: cam.image,
        box,
        plate: meta.kind === 'traffic' ? randomPlate(city.plateState, rng) : undefined,
        confidence: +(0.78 + rng() * 0.2).toFixed(2),
        at: DEMO_ANCHOR - Math.floor(rng() * 50) * 60_000,
        status: 'pending',
      })
    })
  })
  return events.sort((a, b) => b.at - a.at)
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-1',
    title: 'Auto-escalation active',
    body: 'Tickets inactive beyond SLA are escalated to the Municipal Commissioner automatically.',
    at: DEMO_ANCHOR - 20 * 60_000,
    kind: 'info',
    read: false,
  },
  {
    id: 'n-2',
    title: 'Heavy rain alert',
    body: 'IMD predicts heavy showers this evening. Storm Water Drainage teams on standby.',
    at: DEMO_ANCHOR - 55 * 60_000,
    kind: 'warning',
    read: false,
  },
]

export function CivicProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>('citizen')
  const [view, setView] = useState<ViewId>('report')
  const [language, setLanguage] = useState<LanguageCode>('en')
  const [cityId, setCityIdState] = useState<CityId>('hyderabad')
  const [offset, setOffset] = useState(0)
  const [tickets, setTickets] = useState<Ticket[]>(generateAllTickets)
  const [detections, setDetections] = useState<DetectionEvent[]>(() => seedDetections('hyderabad'))
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS)
  const [draft, setDraft] = useState<ReportDraft | null>(null)
  const [feedsLive, setFeedsLive] = useState(true)
  const counter = useRef(20500)

  const realNow = useSyncExternalStore(subscribeClock, getClockSnapshot, getServerClockSnapshot)
  const now = realNow === null || loadedAt === null ? null : DEMO_ANCHOR + (realNow - loadedAt) + offset
  const nowRef = useRef(now)
  nowRef.current = now
  const currentNow = useCallback(() => nowRef.current ?? DEMO_ANCHOR, [])

  const notify = useCallback(
    (n: Omit<AppNotification, 'id' | 'at' | 'read'>) => {
      setNotifications((prev) =>
        [{ ...n, id: `n-${Math.random().toString(36).slice(2, 9)}`, at: currentNow(), read: false }, ...prev].slice(0, 40),
      )
    },
    [currentNow],
  )

  const setRole = useCallback((next: Role) => {
    setRoleState(next)
    setView(next === 'authority' ? 'surveillance' : 'report')
  }, [])

  const setCityId = useCallback((next: CityId) => {
    setCityIdState(next)
    setDetections(seedDetections(next))
  }, [])

  const fastForward = useCallback((hours: number) => setOffset((o) => o + hours * HOUR), [])

  const addTicket = useCallback(
    (input: NewTicketInput) => {
      const city = CITIES[cityId]
      const rng = Math.random
      const coords = input.lat !== undefined && input.lng !== undefined ? { lat: input.lat, lng: input.lng } : randomCoords(city, rng)
      counter.current += Math.floor(1 + Math.random() * 9)
      const ticket = makeTicket({
        city,
        n: counter.current,
        category: input.category,
        severity: input.severity,
        status: 'assigned',
        createdAt: currentNow(),
        description: input.description,
        address: input.address ?? randomAddress(city, rng),
        ...coords,
        reporter: input.source === 'cctv' ? 'CCTV AI' : 'You',
        source: input.source,
        imageUrl: input.imageUrl,
      })
      setTickets((prev) => [ticket, ...prev])
      notify({
        title: `Ticket ${ticket.id} created`,
        body: `Routed to ${ticket.department}. SLA ${ticket.slaHours}h.`,
        kind: 'success',
      })
      return ticket
    },
    [cityId, currentNow, notify],
  )

  const updateTicketStatus = useCallback(
    (id: string, status: TicketStatus, note?: string) => {
      const at = currentNow()
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t
          const meta = CATEGORIES[t.category]
          const labels: Record<TicketStatus, string> = {
            reported: 'Re-opened',
            assigned: `Assigned to ${LOWER_DIVISION[t.category]}`,
            in_progress: 'Field crew dispatched, work in progress',
            escalated: `Manually escalated to ${CITIES[t.city].commissioner}`,
            resolved: note ? `Resolved – ${note}` : 'Resolved – proof-of-fix photo uploaded',
          }
          return {
            ...t,
            status,
            resolvedAt: status === 'resolved' ? at : t.resolvedAt,
            escalatedTo: status === 'escalated' ? CITIES[t.city].commissioner : t.escalatedTo,
            history: [
              ...t.history,
              {
                at,
                label: labels[status],
                actor: status === 'escalated' ? 'Officer' : meta.shortDept,
                kind: status === 'resolved' ? 'success' : status === 'escalated' ? 'escalation' : 'info',
              },
            ],
          }
        }),
      )
      if (status === 'resolved') {
        notify({ title: `${id} resolved`, body: 'Citizen notified with proof-of-fix.', kind: 'success' })
      }
    },
    [currentNow, notify],
  )

  useEffect(() => {
    if (now === null) return
    const overdue = tickets.filter(
      (t) => (t.status === 'reported' || t.status === 'assigned' || t.status === 'in_progress') && t.deadline < now,
    )
    if (overdue.length === 0) return
    const ids = new Set(overdue.map((t) => t.id))
    setTickets((prev) =>
      prev.map((t) => {
        if (!ids.has(t.id)) return t
        const commissioner = CITIES[t.city].commissioner
        return {
          ...t,
          status: 'escalated',
          escalatedTo: commissioner,
          history: [
            ...t.history,
            {
              at: t.deadline,
              label: `SLA of ${t.slaHours}h breached – auto-escalated to ${commissioner}`,
              actor: 'Auto-Escalation Engine',
              kind: 'escalation',
            },
            {
              at: t.deadline + 1000,
              label: `Accountability complaint raised against ${LOWER_DIVISION[t.category]}`,
              actor: 'Auto-Escalation Engine',
              kind: 'warning',
            },
          ],
        }
      }),
    )
    const local = overdue.filter((t) => t.city === cityId)
    if (local.length > 0) {
      const first = local[0]
      const title = local.length === 1 ? `${first.id} auto-escalated` : `${local.length} tickets auto-escalated`
      const body = `SLA breached. Escalated to ${CITIES[cityId].commissioner}; complaint raised against inactive division.`
      notify({ title, body, kind: 'escalation' })
      toast.error(title, { description: body })
    }
  }, [now, tickets, cityId, notify])

  useEffect(() => {
    if (!feedsLive) return
    const id = setInterval(() => {
      const city = CITIES[cityId]
      const cam = CAMERAS[Math.floor(Math.random() * CAMERAS.length)]
      const box = cam.boxes[Math.floor(Math.random() * cam.boxes.length)]
      const meta = VIOLATION_META[box.type]
      const event: DetectionEvent = {
        id: `DET-${city.code}-${Math.floor(Math.random() * 90000 + 10000)}`,
        cameraId: cam.id,
        cameraName: cam.name,
        image: cam.image,
        box,
        plate: meta.kind === 'traffic' ? randomPlate(city.plateState) : undefined,
        confidence: +(0.72 + Math.random() * 0.27).toFixed(2),
        at: currentNow(),
        status: 'pending',
      }
      setDetections((prev) => [event, ...prev].slice(0, 40))
    }, 7000)
    return () => clearInterval(id)
  }, [feedsLive, cityId, currentNow])

  const reviewDetection = useCallback(
    (id: string, decision: 'approved' | 'rejected') => {
      const target = detections.find((d) => d.id === id)
      if (!target) return undefined
      const meta = VIOLATION_META[target.box.type]
      let updated: DetectionEvent = { ...target, status: decision }
      if (decision === 'approved') {
        if (meta.kind === 'traffic') {
          updated = {
            ...updated,
            challanId: `ECH-${CITIES[cityId].code}-${Math.floor(Math.random() * 900000 + 100000)}`,
            fine: meta.fine,
          }
          notify({
            title: 'e-Challan issued',
            body: `${updated.challanId} · ${target.plate} · ₹${meta.fine?.toLocaleString('en-IN')} (${target.box.type})`,
            kind: 'success',
          })
        } else if (meta.category) {
          const ticket = addTicket({
            category: meta.category,
            severity: 'High',
            description: `${target.box.type} detected by CCTV at ${target.cameraName} (confidence ${Math.round(target.confidence * 100)}%).`,
            address: `${target.cameraName}, ${CITIES[cityId].localities[0]}, ${CITIES[cityId].name}`,
            imageUrl: target.image,
            source: 'cctv',
          })
          updated = { ...updated, ticketId: ticket.id }
        }
      }
      setDetections((prev) => prev.map((d) => (d.id === id ? updated : d)))
      return updated
    },
    [detections, cityId, addTicket, notify],
  )

  const markAllRead = useCallback(() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))), [])

  const cityTickets = useMemo(() => tickets.filter((t) => t.city === cityId), [tickets, cityId])

  const value: CivicContextValue = {
    role,
    setRole,
    view,
    setView,
    language,
    setLanguage,
    cityId,
    setCityId,
    now,
    fastForward,
    tickets,
    cityTickets,
    addTicket,
    updateTicketStatus,
    detections,
    reviewDetection,
    notifications,
    notify,
    markAllRead,
    draft,
    setDraft,
    feedsLive,
    setFeedsLive,
  }

  return <CivicContext.Provider value={value}>{children}</CivicContext.Provider>
}

export function useCivic() {
  const ctx = useContext(CivicContext)
  if (!ctx) throw new Error('useCivic must be used within CivicProvider')
  return ctx
}
