'use client'

import { AlertTriangle, CheckCircle2, CircleDot, Download, MapPin, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { CATEGORIES, CITIES, STATUS_META } from '@/lib/civic/data'
import { formatDateTime } from '@/lib/civic/format'
import type { Ticket, TicketEvent } from '@/lib/civic/types'
import { CATEGORY_ICONS, SeverityBadge, SlaCountdown, StatusBadge } from './shared'

const EVENT_ICON: Record<TicketEvent['kind'], typeof CircleDot> = {
  info: CircleDot,
  warning: AlertTriangle,
  success: CheckCircle2,
  escalation: ShieldAlert,
}

const EVENT_TONE: Record<TicketEvent['kind'], string> = {
  info: 'text-info bg-info/10',
  warning: 'text-warning bg-warning/10',
  success: 'text-success bg-success/10',
  escalation: 'text-destructive bg-destructive/10',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

export function downloadReceipt(ticket: Ticket) {
  const city = CITIES[ticket.city]
  const rows = ticket.history
    .map((e) => `<tr><td>${escapeHtml(formatDateTime(e.at))}</td><td>${escapeHtml(e.actor)}</td><td>${escapeHtml(e.label)}</td></tr>`)
    .join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>e-Receipt ${ticket.id}</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;color:#0f172a;padding:0 16px}h1{font-size:20px;margin:0}
.muted{color:#64748b;font-size:13px}.box{border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0}
table{width:100%;border-collapse:collapse;font-size:13px}td,th{text-align:left;padding:8px;border-bottom:1px solid #e2e8f0}
.k{color:#64748b;width:160px}.badge{display:inline-block;background:#d1fae5;color:#065f46;border-radius:999px;padding:2px 10px;font-size:12px}</style></head>
<body><h1>CivicFix – Official Complaint e-Receipt</h1><p class="muted">${escapeHtml(city.corporation)}, ${escapeHtml(city.name)} · Generated ${escapeHtml(formatDateTime(Date.now()))}</p>
<div class="box"><table>
<tr><td class="k">Ticket ID</td><td><strong>${escapeHtml(ticket.id)}</strong></td></tr>
<tr><td class="k">Category</td><td>${escapeHtml(CATEGORIES[ticket.category].label)} (${escapeHtml(ticket.severity)} severity)</td></tr>
<tr><td class="k">Department</td><td>${escapeHtml(ticket.department)}</td></tr>
<tr><td class="k">Location</td><td>${escapeHtml(ticket.address)} (${ticket.lat}, ${ticket.lng})</td></tr>
<tr><td class="k">Filed on</td><td>${escapeHtml(formatDateTime(ticket.createdAt))}</td></tr>
<tr><td class="k">SLA</td><td>${ticket.slaHours} hours · due ${escapeHtml(formatDateTime(ticket.deadline))}</td></tr>
<tr><td class="k">Status</td><td><span class="badge">${escapeHtml(STATUS_META[ticket.status].label)}</span></td></tr>
<tr><td class="k">Description</td><td>${escapeHtml(ticket.description)}</td></tr>
</table></div><h2 style="font-size:15px">Audit trail</h2><table><thead><tr><th>Time</th><th>Actor</th><th>Event</th></tr></thead><tbody>${rows}</tbody></table>
<p class="muted" style="margin-top:24px">This is a system-generated receipt. Unresolved complaints are auto-escalated to the ${escapeHtml(city.commissioner)} upon SLA breach.</p></body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `CivicFix-eReceipt-${ticket.id}.html`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function TicketDetailDialog({
  ticket,
  open,
  onOpenChange,
}: {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!ticket) return null
  const Icon = CATEGORY_ICONS[ticket.category]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <DialogTitle className="font-mono">{ticket.id}</DialogTitle>
          </div>
          <DialogDescription>{ticket.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <SeverityBadge severity={ticket.severity} />
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{CATEGORIES[ticket.category].label}</span>
        </div>

        <dl className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/40 p-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Department</dt>
            <dd className="font-medium">{ticket.department}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Filed</dt>
            <dd className="font-medium">{formatDateTime(ticket.createdAt)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Location</dt>
            <dd className="flex items-start gap-1 font-medium">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                {ticket.address}{' '}
                <span className="font-mono text-xs text-muted-foreground">
                  ({ticket.lat}, {ticket.lng})
                </span>
              </span>
            </dd>
          </div>
          {ticket.escalatedTo ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Escalated to</dt>
              <dd className="font-medium text-destructive">{ticket.escalatedTo}</dd>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <SlaCountdown ticket={ticket} />
          </div>
        </dl>

        <section aria-labelledby="audit-trail">
          <h3 id="audit-trail" className="mb-3 text-sm font-semibold">
            Audit trail
          </h3>
          <ol className="flex flex-col gap-3">
            {ticket.history.map((event, i) => {
              const EIcon = EVENT_ICON[event.kind]
              return (
                <li key={`${event.at}-${i}`} className="flex gap-3">
                  <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full', EVENT_TONE[event.kind])}>
                    <EIcon className="size-3.5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm">{event.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(event.at)} · {event.actor}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <Button onClick={() => downloadReceipt(ticket)} className="w-full">
          <Download data-icon="inline-start" aria-hidden="true" />
          Download official e-Receipt
        </Button>
      </DialogContent>
    </Dialog>
  )
}
