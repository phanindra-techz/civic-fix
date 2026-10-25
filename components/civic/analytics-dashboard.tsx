'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { AlertTriangle, CheckCircle2, Clock, FileText, Timer, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORIES, CITIES, DEMO_ANCHOR, HOUR } from '@/lib/civic/data'
import { formatHours, mapPosition } from '@/lib/civic/format'
import type { IssueCategory } from '@/lib/civic/types'
import { useCivic } from './civic-provider'
import { CATEGORY_ICONS, SectionHeading } from './shared'
import { TicketDetailDialog } from './ticket-detail-dialog'

const HEAT_COLOR: Record<IssueCategory, string> = {
  pothole: '#f59e0b',
  garbage: '#10b981',
  waterlogging: '#6366f1',
  streetlight: '#facc15',
  traffic: '#ef4444',
}

const ALL_CATEGORIES: IssueCategory[] = ['pothole', 'garbage', 'waterlogging', 'streetlight', 'traffic']

function gradeFor(score: number) {
  if (score >= 85) return { grade: 'A', tone: 'text-success bg-success/15' }
  if (score >= 70) return { grade: 'B', tone: 'text-info bg-info/15' }
  if (score >= 55) return { grade: 'C', tone: 'text-warning bg-warning/15' }
  return { grade: 'D', tone: 'text-destructive bg-destructive/15' }
}

export function AnalyticsDashboard() {
  const { cityTickets, cityId, now } = useCivic()
  const city = CITIES[cityId]
  const [active, setActive] = useState<Set<IssueCategory>>(new Set(ALL_CATEGORIES))
  const [openOnly, setOpenOnly] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  const metrics = useMemo(() => {
    const total = cityTickets.length
    const resolved = cityTickets.filter((t) => t.status === 'resolved')
    const escalated = cityTickets.filter((t) => t.status === 'escalated').length
    const onTime = resolved.filter((t) => t.resolvedAt && t.resolvedAt <= t.deadline).length
    const avgMs = resolved.length
      ? resolved.reduce((s, t) => s + ((t.resolvedAt ?? t.createdAt) - t.createdAt), 0) / resolved.length
      : 0
    const closedOrBreached = resolved.length + escalated
    return {
      total,
      resolved: resolved.length,
      resolvedPct: total ? Math.round((resolved.length / total) * 100) : 0,
      escalated,
      avgMs,
      slaPct: closedOrBreached ? Math.round((onTime / closedOrBreached) * 100) : 100,
    }
  }, [cityTickets])

  const departments = useMemo(() => {
    return ALL_CATEGORIES.map((c) => {
      const items = cityTickets.filter((t) => t.category === c)
      const resolved = items.filter((t) => t.status === 'resolved')
      const escalated = items.filter((t) => t.status === 'escalated').length
      const onTime = resolved.filter((t) => t.resolvedAt && t.resolvedAt <= t.deadline).length
      const avg = resolved.length ? resolved.reduce((s, t) => s + ((t.resolvedAt ?? 0) - t.createdAt), 0) / resolved.length : 0
      const resolutionRate = items.length ? resolved.length / items.length : 1
      const slaRate = resolved.length + escalated ? onTime / (resolved.length + escalated) : 1
      const speed = resolved.length ? Math.max(0, 1 - avg / (CATEGORIES[c].slaHours * HOUR)) : 0.5
      const score = Math.round(resolutionRate * 35 + slaRate * 45 + speed * 20)
      return { category: c, meta: CATEGORIES[c], total: items.length, resolved: resolved.length, escalated, avg, slaRate, score }
    }).sort((a, b) => b.score - a.score)
  }, [cityTickets])

  const trend = useMemo(() => {
    const base = now ?? DEMO_ANCHOR
    return Array.from({ length: 7 }, (_, i) => {
      const end = base - (6 - i) * 24 * HOUR
      const start = end - 24 * HOUR
      const day = new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }).format(end)
      const created = cityTickets.filter((t) => t.createdAt > start && t.createdAt <= end).length
      const resolved = cityTickets.filter((t) => t.resolvedAt && t.resolvedAt > start && t.resolvedAt <= end).length
      return { day, created, resolved }
    })
  }, [cityTickets, now])
  const trendMax = Math.max(1, ...trend.flatMap((d) => [d.created, d.resolved]))

  const points = cityTickets.filter((t) => active.has(t.category) && (!openOnly || t.status !== 'resolved'))
  const openTicket = openId ? cityTickets.find((t) => t.id === openId) ?? null : null

  const kpis = [
    { label: 'Total complaints', value: metrics.total, icon: FileText, tone: 'text-info bg-info/10' },
    { label: 'Resolved', value: `${metrics.resolvedPct}%`, sub: `${metrics.resolved} tickets`, icon: CheckCircle2, tone: 'text-success bg-success/10' },
    { label: 'Avg. resolution', value: metrics.avgMs ? formatHours(metrics.avgMs) : '—', icon: Timer, tone: 'text-primary bg-primary/10' },
    { label: 'SLA compliance', value: `${metrics.slaPct}%`, icon: Clock, tone: 'text-warning bg-warning/10' },
    { label: 'Escalated', value: metrics.escalated, sub: 'to Commissioner', icon: AlertTriangle, tone: 'text-destructive bg-destructive/10' },
  ]

  function toggle(c: IssueCategory) {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow={`${city.corporation} performance`}
        title="City analytics"
        description="Live accountability metrics across departments — resolution speed, SLA compliance and where problems cluster."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <span className={cn('flex size-8 items-center justify-center rounded-lg', k.tone)}>
              <k.icon className="size-4" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <span className="text-2xl font-semibold tabular-nums">{k.value}</span>
              <span className="text-xs text-muted-foreground">
                {k.label}
                {k.sub ? ` · ${k.sub}` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section aria-labelledby="heatmap-heading" className="flex flex-col gap-4 rounded-xl border bg-card p-4 lg:col-span-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="heatmap-heading" className="font-semibold">
              Issue heatmap · {city.name}
            </h2>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="accent-primary" />
              Unresolved only
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c]
              const on = active.has(c)
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(c)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                    on ? 'bg-secondary font-medium' : 'text-muted-foreground opacity-60 hover:opacity-100',
                  )}
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: HEAT_COLOR[c] }} aria-hidden="true" />
                  <Icon className="size-3" aria-hidden="true" />
                  {CATEGORIES[c].label}
                </button>
              )
            })}
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border bg-slate-900">
            <Image src="/city-map.png" alt={`Stylised map of ${city.name}`} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover opacity-90" />
            {points.map((t) => {
              const pos = mapPosition(t.city, t.lat, t.lng)
              return (
                <span
                  key={`halo-${t.id}`}
                  className="pointer-events-none absolute size-24 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 mix-blend-screen blur-xl"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, backgroundColor: HEAT_COLOR[t.category] }}
                  aria-hidden="true"
                />
              )
            })}
            {points.map((t) => {
              const pos = mapPosition(t.city, t.lat, t.lng)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOpenId(t.id)}
                  title={`${t.id} · ${CATEGORIES[t.category].label} · ${t.address}`}
                  aria-label={`${CATEGORIES[t.category].label} at ${t.address}`}
                  className={cn(
                    'absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 shadow transition-transform hover:scale-150 focus-visible:scale-150 focus-visible:outline-none',
                    t.status === 'escalated' && 'animate-pulse',
                  )}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, backgroundColor: HEAT_COLOR[t.category] }}
                />
              )
            })}
            <span className="absolute right-2 bottom-2 rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-white">
              {points.length} incidents plotted
            </span>
          </div>
        </section>

        <section aria-labelledby="trend-heading" className="flex flex-col gap-4 rounded-xl border bg-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 id="trend-heading" className="flex items-center gap-2 font-semibold">
              <TrendingUp className="size-4 text-primary" aria-hidden="true" />
              Last 7 days
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-chart-2" aria-hidden="true" />
                Filed
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-chart-1" aria-hidden="true" />
                Resolved
              </span>
            </div>
          </div>
          <div className="flex h-44 items-end gap-2" role="img" aria-label="Daily filed vs resolved complaints for the last 7 days">
            {trend.map((d, i) => (
              <div key={`${d.day}-${i}`} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-36 w-full items-end justify-center gap-1">
                  <div className="w-1/2 max-w-3 rounded-t bg-chart-2" style={{ height: `${(d.created / trendMax) * 100}%` }} />
                  <div className="w-1/2 max-w-3 rounded-t bg-chart-1" style={{ height: `${(d.resolved / trendMax) * 100}%` }} />
                </div>
                <span className="text-[11px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 border-t pt-4">
            <h3 className="text-sm font-medium">By category</h3>
            {ALL_CATEGORIES.map((c) => {
              const count = cityTickets.filter((t) => t.category === c).length
              const pct = metrics.total ? (count / metrics.total) * 100 : 0
              return (
                <div key={c} className="flex items-center gap-3 text-xs">
                  <span className="w-24 shrink-0">{CATEGORIES[c].label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: HEAT_COLOR[c] }} />
                  </div>
                  <span className="w-6 text-right font-mono tabular-nums">{count}</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <section aria-labelledby="dept-heading" className="flex flex-col gap-4 rounded-xl border bg-card p-4">
        <div>
          <h2 id="dept-heading" className="font-semibold">
            Department performance scores
          </h2>
          <p className="text-xs text-muted-foreground">Score = 45% SLA compliance + 35% resolution rate + 20% speed vs. SLA.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">Rank</th>
                <th scope="col" className="py-2 pr-3 font-medium">Department</th>
                <th scope="col" className="py-2 pr-3 font-medium">Tickets</th>
                <th scope="col" className="py-2 pr-3 font-medium">Resolved</th>
                <th scope="col" className="py-2 pr-3 font-medium">Escalated</th>
                <th scope="col" className="py-2 pr-3 font-medium">Avg. time</th>
                <th scope="col" className="py-2 pr-3 font-medium">SLA</th>
                <th scope="col" className="w-56 py-2 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d, i) => {
                const g = gradeFor(d.score)
                return (
                  <tr key={d.category} className="border-b last:border-0">
                    <td className="py-3 pr-3 font-mono text-muted-foreground">#{i + 1}</td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{d.meta.department}</span>
                        <span className="text-xs text-muted-foreground">SLA target {d.meta.slaHours}h</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 tabular-nums">{d.total}</td>
                    <td className="py-3 pr-3 tabular-nums">{d.resolved}</td>
                    <td className={cn('py-3 pr-3 tabular-nums', d.escalated > 0 && 'text-destructive')}>{d.escalated}</td>
                    <td className="py-3 pr-3 tabular-nums">{d.avg ? formatHours(d.avg) : '—'}</td>
                    <td className="py-3 pr-3 tabular-nums">{Math.round(d.slaRate * 100)}%</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn('h-full rounded-full', d.score >= 70 ? 'bg-success' : d.score >= 55 ? 'bg-warning' : 'bg-destructive')}
                            style={{ width: `${d.score}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-xs tabular-nums">{d.score}</span>
                        <span className={cn('flex size-6 items-center justify-center rounded text-xs font-bold', g.tone)}>{g.grade}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <TicketDetailDialog ticket={openTicket} open={openTicket !== null} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  )
}
