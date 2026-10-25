'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera as CameraIcon, CheckCircle2, Eye, Pause, Play, ReceiptIndianRupee, ScanLine, ShieldAlert, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { CAMERAS, CITIES, VIOLATION_META } from '@/lib/civic/data'
import { formatClock, formatDateTime } from '@/lib/civic/format'
import type { Camera, DetectionBox, DetectionEvent } from '@/lib/civic/types'
import { useCivic } from './civic-provider'
import { SectionHeading } from './shared'

const FRAME_ASPECT = 'aspect-[1408/768]'

function DetectionStatusPill({ event }: { event: DetectionEvent }) {
  if (event.status === 'pending') {
    return <span className="w-fit rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">Awaiting review</span>
  }
  if (event.status === 'rejected') {
    return <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">False positive</span>
  }
  return (
    <span className="w-fit rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
      {event.challanId ? 'e-Challan issued' : 'Ticket created'}
    </span>
  )
}

function CameraFeed({ camera, onSelect }: { camera: Camera; onSelect: (camera: Camera, box: DetectionBox) => void }) {
  const { now, feedsLive, cityId } = useCivic()
  const t = (now ?? 0) / 1000
  const city = CITIES[cityId]
  return (
    <article className="overflow-hidden rounded-xl border bg-black">
      <div className={cn('relative', FRAME_ASPECT)}>
        <Image
          src={camera.image}
          alt={`Live CCTV feed: ${camera.name}`}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className={cn('object-cover saturate-[0.65]', !feedsLive && 'grayscale')}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0 1px, transparent 1px 3px)' }}
          aria-hidden="true"
        />
        {feedsLive ? <div className="animate-scan pointer-events-none absolute inset-x-0 h-px bg-emerald-400/60" aria-hidden="true" /> : null}

        {camera.boxes.map((box, i) => {
          const meta = VIOLATION_META[box.type]
          const jx = feedsLive ? Math.sin(t * 0.9 + i * 2) * 0.006 : 0
          const jy = feedsLive ? Math.cos(t * 0.7 + i) * 0.005 : 0
          const conf = 86 + Math.round(((Math.sin(t + i * 3) + 1) / 2) * 12)
          return (
            <button
              key={`${box.type}-${i}`}
              type="button"
              onClick={() => onSelect(camera, box)}
              className="absolute rounded-sm border-2 transition-all duration-1000 ease-linear outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
              style={{
                left: `${(box.x + jx) * 100}%`,
                top: `${(box.y + jy) * 100}%`,
                width: `${box.w * 100}%`,
                height: `${box.h * 100}%`,
                borderColor: meta.color,
              }}
              aria-label={`${box.type} detected on ${camera.name}. Open evidence.`}
            >
              <span
                className="absolute -top-5 left-[-2px] rounded-t-sm px-1 py-0.5 font-mono text-[10px] leading-none font-semibold whitespace-nowrap text-black"
                style={{ backgroundColor: meta.color }}
              >
                {box.type} {conf}%
              </span>
            </button>
          )
        })}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent p-2.5 font-mono text-[11px] text-white">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className={cn('size-2 rounded-full', feedsLive ? 'animate-pulse bg-red-500' : 'bg-white/50')} aria-hidden="true" />
              {feedsLive ? 'REC' : 'PAUSED'} · {camera.id.toUpperCase()}
            </span>
            <span className="text-white/80">
              {camera.name} · {city.localities[CAMERAS.indexOf(camera) % city.localities.length]}
            </span>
          </div>
          <span className="tabular-nums">{now === null ? '--:--:--' : formatClock(now)}</span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-2.5 font-mono text-[10px] text-white/90">
          <span className="flex items-center gap-1">
            <ScanLine className="size-3" aria-hidden="true" />
            AI · {camera.boxes.length} objects flagged
          </span>
          <span>1080p · 25fps</span>
        </div>
      </div>
    </article>
  )
}

function EvidenceCrop({ event }: { event: DetectionEvent }) {
  const { box } = event
  const scale = Math.min(6, Math.max(1.4, 0.55 / box.w))
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  const pos = (c: number) => Math.min(100, Math.max(0, ((c * scale - 0.5) / (scale - 1)) * 100))
  return (
    <div
      className={cn('relative overflow-hidden rounded-lg border bg-black bg-no-repeat', FRAME_ASPECT)}
      style={{
        backgroundImage: `url(${event.image})`,
        backgroundSize: `${scale * 100}% auto`,
        backgroundPosition: `${pos(cx)}% ${pos(cy)}%`,
      }}
      role="img"
      aria-label={`Zoomed evidence of ${event.box.type}`}
    >
      <span className="absolute top-2 left-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">ZOOM {scale.toFixed(1)}x</span>
    </div>
  )
}

function EvidenceDialog({ event, onClose }: { event: DetectionEvent | null; onClose: () => void }) {
  const { reviewDetection, detections } = useCivic()
  const live = event ? detections.find((d) => d.id === event.id) ?? event : null
  if (!live) return null
  const meta = VIOLATION_META[live.box.type]

  function decide(decision: 'approved' | 'rejected') {
    if (!live) return
    const result = reviewDetection(live.id, decision)
    if (!result) return
    if (decision === 'rejected') {
      toast('Marked as false positive', { description: 'Feedback sent to retrain the detection model.' })
    } else if (result.challanId) {
      toast.success(`e-Challan ${result.challanId} issued`, {
        description: `${result.plate} · ₹${result.fine?.toLocaleString('en-IN')} · SMS sent to registered owner`,
      })
    } else if (result.ticketId) {
      toast.success(`Civic ticket ${result.ticketId} created`, { description: 'Routed to the responsible department.' })
    }
  }

  return (
    <Dialog open={event !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5" style={{ color: meta.color }} aria-hidden="true" />
            {live.box.type}
          </DialogTitle>
          <DialogDescription>
            Evidence {live.id} · {live.cameraName} · {formatDateTime(live.at)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Full frame</span>
            <div className={cn('relative overflow-hidden rounded-lg border', FRAME_ASPECT)}>
              <Image src={live.image} alt={`CCTV frame from ${live.cameraName}`} fill sizes="400px" className="object-cover" />
              <div
                className="absolute rounded-sm border-2"
                style={{
                  left: `${live.box.x * 100}%`,
                  top: `${live.box.y * 100}%`,
                  width: `${live.box.w * 100}%`,
                  height: `${live.box.h * 100}%`,
                  borderColor: meta.color,
                }}
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Evidence crop</span>
            <EvidenceCrop event={live} />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 text-sm md:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">AI confidence</dt>
            <dd className="font-mono font-semibold">{Math.round(live.confidence * 100)}%</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Category</dt>
            <dd className="font-medium capitalize">{meta.kind} violation</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{meta.kind === 'traffic' ? 'Fine (MV Act)' : 'Action'}</dt>
            <dd className="font-medium">{meta.fine ? `₹${meta.fine.toLocaleString('en-IN')}` : 'Create civic ticket'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd>
              <DetectionStatusPill event={live} />
            </dd>
          </div>
        </dl>

        {live.plate ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">License plate · OCR</span>
            <span className="rounded-md border-2 border-neutral-900 bg-white px-3 py-1 font-mono text-base font-bold tracking-widest text-neutral-900">
              {live.plate}
            </span>
            <span className="text-xs text-muted-foreground">OCR confidence {Math.min(99, Math.round(live.confidence * 100) + 3)}%</span>
          </div>
        ) : null}

        {live.status === 'pending' ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => decide('rejected')}>
              <XCircle data-icon="inline-start" aria-hidden="true" />
              Reject (false positive)
            </Button>
            <Button onClick={() => decide('approved')}>
              {meta.kind === 'traffic' ? (
                <ReceiptIndianRupee data-icon="inline-start" aria-hidden="true" />
              ) : (
                <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
              )}
              {meta.kind === 'traffic' ? 'Approve & issue e-Challan' : 'Approve & create ticket'}
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg p-3 text-sm',
              live.status === 'approved' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
            )}
          >
            {live.status === 'approved' ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <XCircle className="size-4" aria-hidden="true" />}
            {live.challanId
              ? `e-Challan ${live.challanId} issued for ₹${live.fine?.toLocaleString('en-IN')}. Owner notified via SMS.`
              : live.ticketId
                ? `Civic ticket ${live.ticketId} created and routed.`
                : 'Rejected as false positive. Model feedback recorded.'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function SurveillanceConsole() {
  const { detections, feedsLive, setFeedsLive, cityId } = useCivic()
  const [selected, setSelected] = useState<DetectionEvent | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending'>('all')
  const city = CITIES[cityId]

  const pending = detections.filter((d) => d.status === 'pending').length
  const challans = detections.filter((d) => d.challanId)
  const revenue = challans.reduce((s, d) => s + (d.fine ?? 0), 0)
  const visible = filter === 'pending' ? detections.filter((d) => d.status === 'pending') : detections

  function openFromBox(camera: Camera, box: DetectionBox) {
    const match =
      detections.find((d) => d.cameraId === camera.id && d.box === box && d.status === 'pending') ??
      detections.find((d) => d.cameraId === camera.id && d.box === box)
    if (match) setSelected(match)
  }

  const stats = [
    { label: 'Cameras online', value: `${CAMERAS.length}/${CAMERAS.length}`, icon: CameraIcon },
    { label: 'Detections (live)', value: detections.length, icon: Eye },
    { label: 'Awaiting review', value: pending, icon: ShieldAlert },
    { label: 'e-Challans issued', value: `${challans.length} · ₹${revenue.toLocaleString('en-IN')}`, icon: ReceiptIndianRupee },
  ]

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow={`${city.name} Traffic & Civic Command Centre`}
        title="Smart CCTV surveillance"
        description="Computer-vision models scan live feeds for helmet violations, red-light jumping, triple riding, wrong-side driving, overflowing garbage and road flooding."
        actions={
          <Button variant={feedsLive ? 'outline' : 'default'} onClick={() => setFeedsLive(!feedsLive)}>
            {feedsLive ? <Pause data-icon="inline-start" aria-hidden="true" /> : <Play data-icon="inline-start" aria-hidden="true" />}
            {feedsLive ? 'Pause feeds' : 'Resume feeds'}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="size-4" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs text-muted-foreground">{s.label}</span>
              <span className="truncate font-semibold tabular-nums">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section aria-label="Live camera feeds" className="grid content-start gap-4 md:grid-cols-2 xl:col-span-2">
          {CAMERAS.map((cam) => (
            <CameraFeed key={cam.id} camera={cam} onSelect={openFromBox} />
          ))}
        </section>

        <section aria-labelledby="events-heading" className="flex max-h-[720px] flex-col overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between gap-2 border-b p-3">
            <h2 id="events-heading" className="flex items-center gap-2 text-sm font-semibold">
              <span className={cn('size-2 rounded-full', feedsLive ? 'animate-pulse bg-destructive' : 'bg-muted-foreground')} aria-hidden="true" />
              Detection events
            </h2>
            <div className="flex rounded-md border bg-muted p-0.5 text-xs" role="radiogroup" aria-label="Filter events">
              {(['all', 'pending'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-[5px] px-2 py-1 capitalize',
                    filter === f ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground',
                  )}
                >
                  {f === 'pending' ? `Pending (${pending})` : 'All'}
                </button>
              ))}
            </div>
          </div>
          <ul className="flex-1 divide-y overflow-y-auto">
            {visible.map((d) => {
              const meta = VIOLATION_META[d.box.type]
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(d)}
                    className="flex w-full gap-3 p-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                  >
                    <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border">
                      <Image src={d.image} alt="" fill sizes="80px" className="object-cover" />
                      <span
                        className="absolute border"
                        style={{
                          left: `${d.box.x * 100}%`,
                          top: `${d.box.y * 100}%`,
                          width: `${d.box.w * 100}%`,
                          height: `${d.box.h * 100}%`,
                          borderColor: meta.color,
                        }}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{d.box.type}</span>
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">{formatClock(d.at)}</span>
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {d.cameraName}
                        {d.plate ? ` · ${d.plate}` : ''} · {Math.round(d.confidence * 100)}%
                      </span>
                      <DetectionStatusPill event={d} />
                    </span>
                  </button>
                </li>
              )
            })}
            {visible.length === 0 ? <li className="p-6 text-center text-sm text-muted-foreground">No pending detections.</li> : null}
          </ul>
        </section>
      </div>

      <EvidenceDialog event={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
