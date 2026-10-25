'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Clock, FastForward, Gavel, Search, ShieldAlert, UserCheck, Wrench, CheckCircle2, FilePlus2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { CATEGORIES, CITIES, STATUS_META, STATUS_ORDER } from '@/lib/civic/data'
import { formatDateTime } from '@/lib/civic/format'
import type { IssueCategory, Ticket, TicketStatus } from '@/lib/civic/types'
import { useCivic } from './civic-provider'
import { CATEGORY_ICONS, SectionHeading, SeverityBadge, SlaCountdown, StatusBadge } from './shared'
import { TicketDetailDialog } from './ticket-detail-dialog'

const NEXT_ACTION: Partial<Record<TicketStatus, { to: TicketStatus; label: string }>> = {
  reported: { to: 'assigned', label: 'Assign' },
  assigned: { to: 'in_progress', label: 'Start work' },
  in_progress: { to: 'resolved', label: 'Resolve' },
  escalated: { to: 'resolved', label: 'Resolve' },
}

const COLUMN_LIMIT = 6

function KanbanCard({
  ticket,
  canAct,
  onOpen,
  onAdvance,
}: {
  ticket: Ticket
  canAct: boolean
  onOpen: () => void
  onAdvance: (to: TicketStatus) => void
}) {
  const Icon = CATEGORY_ICONS[ticket.category]
  const action = NEXT_ACTION[ticket.status]
  return (
    <article
      className={cn(
        'flex flex-col gap-2.5 rounded-lg border bg-card p-3 shadow-xs transition-colors hover:border-primary/40',
        ticket.status === 'escalated' && 'border-destructive/40',
      )}
    >
      <button type="button" onClick={onOpen} className="flex flex-col gap-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Icon className="size-3.5 text-primary" aria-hidden="true" />
            <span className="font-mono text-xs font-semibold">{ticket.id}</span>
          </span>
          <SeverityBadge severity={ticket.severity} />
        </span>
        <span className="line-clamp-2 text-sm">{ticket.description}</span>
        <span className="truncate text-xs text-muted-foreground">{ticket.address}</span>
      </button>
      <div className="flex items-center justify-between gap-2 border-t pt-2">
        <span className="text-[11px] font-medium text-muted-foreground">{CATEGORIES[ticket.category].shortDept}</span>
        <SlaCountdown ticket={ticket} compact />
      </div>
      {ticket.status === 'escalated' && ticket.escalatedTo ? (
        <span className="flex items-center gap-1 text-[11px] text-destructive">
          <ShieldAlert className="size-3" aria-hidden="true" />
          {ticket.escalatedTo}
        </span>
      ) : null}
      {canAct && action ? (
        <Button size="xs" variant={action.to === 'resolved' ? 'default' : 'outline'} onClick={() => onAdvance(action.to)}>
          {action.label}
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      ) : null}
    </article>
  )
}

function EscalationWorkflow() {
  const { cityId, fastForward, cityTickets } = useCivic()
  const city = CITIES[cityId]
  const escalated = cityTickets.filter((t) => t.status === 'escalated').length
  const steps = [
    { icon: FilePlus2, title: 'Citizen reports', body: 'Photo + GPS, AI routes to department' },
    { icon: UserCheck, title: 'Assigned to lower division', body: 'Ward engineer / inspector, SLA timer starts' },
    { icon: Clock, title: '48h without action', body: 'SLA breach detected automatically' },
    { icon: ShieldAlert, title: `Escalated to ${city.commissioner}`, body: 'Higher authority notified instantly', danger: true },
    { icon: Gavel, title: 'Complaint vs. inactive division', body: 'Logged in officer accountability record', danger: true },
  ]
  return (
    <section aria-labelledby="escalation-heading" className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="escalation-heading" className="font-semibold">
            Auto-escalation workflow
          </h2>
          <p className="text-sm text-muted-foreground">
            {escalated} ticket{escalated === 1 ? '' : 's'} currently escalated in {city.name}. Fast-forward time to see the engine act.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            fastForward(12)
            toast('Demo clock advanced by 12 hours', { description: 'Overdue tickets will auto-escalate.' })
          }}
        >
          <FastForward data-icon="inline-start" aria-hidden="true" />
          Simulate +12h inactivity
        </Button>
      </div>
      <ol className="grid gap-3 md:grid-cols-5">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex gap-3 md:flex-col">
            <div className="flex items-center gap-2 md:w-full">
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full border-2',
                  s.danger ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-primary/40 bg-primary/10 text-primary',
                )}
              >
                <s.icon className="size-4" aria-hidden="true" />
              </span>
              {i < steps.length - 1 ? <span className="hidden h-0.5 flex-1 bg-border md:block" aria-hidden="true" /> : null}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{s.title}</span>
              <span className="text-xs text-muted-foreground">{s.body}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function IncidentTracker() {
  const { cityTickets, role, updateTicketStatus } = useCivic()
  const canAct = role === 'authority'
  const [openId, setOpenId] = useState<string | null>(null)
  const [resolveId, setResolveId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [proofName, setProofName] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'all'>('all')
  const [limit, setLimit] = useState(12)

  const openTicket = openId ? cityTickets.find((t) => t.id === openId) ?? null : null
  const resolveTicket = resolveId ? cityTickets.find((t) => t.id === resolveId) ?? null : null

  const columns = useMemo(() => {
    const map = Object.fromEntries(STATUS_ORDER.map((s) => [s, [] as Ticket[]])) as Record<TicketStatus, Ticket[]>
    cityTickets.forEach((t) => map[t.status].push(t))
    map.escalated.sort((a, b) => a.deadline - b.deadline)
    return map
  }, [cityTickets])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cityTickets.filter(
      (t) =>
        (statusFilter === 'all' || t.status === statusFilter) &&
        (categoryFilter === 'all' || t.category === categoryFilter) &&
        (!q || t.id.toLowerCase().includes(q) || t.address.toLowerCase().includes(q) || t.department.toLowerCase().includes(q)),
    )
  }, [cityTickets, query, statusFilter, categoryFilter])

  function advance(ticket: Ticket, to: TicketStatus) {
    if (to === 'resolved') {
      setResolveId(ticket.id)
      setNote('')
      setProofName(null)
      return
    }
    updateTicketStatus(ticket.id, to)
    toast.success(`${ticket.id} → ${STATUS_META[to].label}`)
  }

  function confirmResolve() {
    if (!resolveTicket) return
    updateTicketStatus(resolveTicket.id, 'resolved', note.trim() || (proofName ? `proof uploaded (${proofName})` : undefined))
    toast.success(`${resolveTicket.id} resolved`, { description: 'Citizen notified with proof-of-fix.' })
    setResolveId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow={canAct ? 'Authority console' : 'Public transparency board'}
        title="Incident tracker"
        description={
          canAct
            ? 'Move tickets through the pipeline. Anything that breaches SLA is escalated automatically — no manual follow-up needed.'
            : 'Every complaint in the city, its department and SLA countdown — fully transparent. Switch to Authority to take action.'
        }
      />

      <EscalationWorkflow />

      <section aria-label="Ticket pipeline" className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="grid min-w-[1100px] grid-cols-5 gap-3">
          {STATUS_ORDER.map((status) => {
            const items = columns[status]
            return (
              <div key={status} className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={status} />
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.slice(0, COLUMN_LIMIT).map((t) => (
                    <KanbanCard key={t.id} ticket={t} canAct={canAct} onOpen={() => setOpenId(t.id)} onAdvance={(to) => advance(t, to)} />
                  ))}
                  {items.length > COLUMN_LIMIT ? (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter(status)
                        document.getElementById('all-tickets')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="rounded-md py-1.5 text-xs text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                      +{items.length - COLUMN_LIMIT} more in table
                    </button>
                  ) : null}
                  {items.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">No tickets</p> : null}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section id="all-tickets" aria-labelledby="table-heading" className="flex flex-col gap-4 rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 id="table-heading" className="font-semibold">
            All tickets <span className="font-normal text-muted-foreground">({filtered.length})</span>
          </h2>
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, location, department"
              aria-label="Search tickets"
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs transition-colors',
                statusFilter === s ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted',
              )}
            >
              {s === 'all' ? 'All statuses' : STATUS_META[s].label}
            </button>
          ))}
          <span className="mx-1 hidden w-px bg-border sm:block" aria-hidden="true" />
          {(['all', 'pothole', 'garbage', 'waterlogging', 'streetlight', 'traffic'] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={categoryFilter === c}
              onClick={() => setCategoryFilter(c)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs transition-colors',
                categoryFilter === c ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted',
              )}
            >
              {c === 'all' ? 'All categories' : CATEGORIES[c].label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">Ticket</th>
                <th scope="col" className="py-2 pr-3 font-medium">Category</th>
                <th scope="col" className="py-2 pr-3 font-medium">Location</th>
                <th scope="col" className="py-2 pr-3 font-medium">Department</th>
                <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                <th scope="col" className="py-2 pr-3 font-medium">Filed</th>
                <th scope="col" className="py-2 font-medium">SLA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, limit).map((t) => {
                const Icon = CATEGORY_ICONS[t.category]
                return (
                  <tr
                    key={t.id}
                    onClick={() => setOpenId(t.id)}
                    className="cursor-pointer border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-2.5 pr-3">
                      <button type="button" className="font-mono text-xs font-semibold hover:underline" onClick={() => setOpenId(t.id)}>
                        {t.id}
                      </button>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-1.5">
                        <Icon className="size-3.5 text-primary" aria-hidden="true" />
                        {CATEGORIES[t.category].label}
                      </span>
                    </td>
                    <td className="max-w-56 truncate py-2.5 pr-3 text-muted-foreground">{t.address}</td>
                    <td className="py-2.5 pr-3">{CATEGORIES[t.category].shortDept}</td>
                    <td className="py-2.5 pr-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">{formatDateTime(t.createdAt)}</td>
                    <td className="py-2.5 whitespace-nowrap">
                      <SlaCountdown ticket={t} compact />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No tickets match these filters.</p> : null}
        </div>
        {filtered.length > limit ? (
          <Button variant="outline" onClick={() => setLimit((l) => l + 12)} className="self-center">
            Show more ({filtered.length - limit} remaining)
          </Button>
        ) : null}
      </section>

      <TicketDetailDialog ticket={openTicket} open={openTicket !== null} onOpenChange={(o) => !o && setOpenId(null)} />

      <Dialog open={resolveTicket !== null} onOpenChange={(o) => !o && setResolveId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="size-4 text-primary" aria-hidden="true" />
              Resolve {resolveTicket?.id}
            </DialogTitle>
            <DialogDescription>Attach proof-of-fix. The citizen receives the photo and resolution note.</DialogDescription>
          </DialogHeader>
          <label
            htmlFor="proof"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-5 text-center text-sm hover:bg-muted/50"
          >
            {proofName ? (
              <>
                <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
                <span className="font-medium">{proofName}</span>
              </>
            ) : (
              <>
                <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
                <span>Upload proof-of-fix photo</span>
              </>
            )}
            <input
              id="proof"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setProofName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
          <div className="flex flex-col gap-2">
            <Label htmlFor="resolve-note">Resolution note</Label>
            <Textarea id="resolve-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Pothole patched with cold-mix asphalt" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveId(null)}>
              Cancel
            </Button>
            <Button onClick={confirmResolve}>Mark resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
