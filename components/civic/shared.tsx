'use client'

import { Car, Droplets, Lightbulb, Trash2, Construction, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEVERITY_TONE, STATUS_META } from '@/lib/civic/data'
import { formatCountdown } from '@/lib/civic/format'
import type { IssueCategory, Severity, Ticket, TicketStatus } from '@/lib/civic/types'
import { useCivic } from './civic-provider'

export const CATEGORY_ICONS: Record<IssueCategory, LucideIcon> = {
  pothole: Construction,
  garbage: Trash2,
  waterlogging: Droplets,
  streetlight: Lightbulb,
  traffic: Car,
}

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        meta.tone,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', SEVERITY_TONE[severity])}>
      {severity}
    </span>
  )
}

export function SlaCountdown({ ticket, compact = false }: { ticket: Ticket; compact?: boolean }) {
  const { now } = useCivic()

  if (ticket.status === 'resolved' && ticket.resolvedAt) {
    const onTime = ticket.resolvedAt <= ticket.deadline
    return (
      <span className={cn('font-mono text-xs tabular-nums', onTime ? 'text-success' : 'text-warning')}>
        {onTime ? 'Within SLA' : 'Resolved late'}
      </span>
    )
  }

  if (now === null) {
    return <span className="font-mono text-xs text-muted-foreground tabular-nums">--:--:--</span>
  }

  const remaining = ticket.deadline - now
  const total = ticket.slaHours * 3_600_000
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100))
  const tone = remaining < 0 ? 'text-destructive' : pct < 25 ? 'text-warning' : 'text-success'
  const bar = remaining < 0 ? 'bg-destructive' : pct < 25 ? 'bg-warning' : 'bg-success'

  if (compact) {
    return (
      <span className={cn('font-mono text-xs tabular-nums', tone)}>
        {remaining < 0 ? `Overdue ${formatCountdown(remaining).slice(1)}` : formatCountdown(remaining)}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">{remaining < 0 ? 'SLA overdue by' : 'SLA remaining'}</span>
        <span className={cn('font-mono text-sm font-semibold tabular-nums', tone)}>
          {formatCountdown(Math.abs(remaining))}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
        <div className={cn('h-full rounded-full transition-all', bar)} style={{ width: `${remaining < 0 ? 100 : pct}%` }} />
      </div>
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        {eyebrow ? <p className="text-xs font-medium tracking-wider text-primary uppercase">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-muted-foreground text-pretty">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
