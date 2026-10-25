'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  CheckCircle2,
  Crosshair,
  Download,
  ImageUp,
  Loader2,
  MapPin,
  RotateCcw,
  ScanSearch,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { CATEGORIES, CITIES, REPORTABLE_CATEGORIES, SAMPLE_PHOTOS, hashString, randomAddress, randomCoords, createRng } from '@/lib/civic/data'
import { formatDateTime } from '@/lib/civic/format'
import type { IssueCategory, Severity, Ticket } from '@/lib/civic/types'
import { useCivic } from './civic-provider'
import { CATEGORY_ICONS, SectionHeading, SeverityBadge, SlaCountdown, StatusBadge } from './shared'
import { downloadReceipt } from './ticket-detail-dialog'

type Phase = 'idle' | 'analyzing' | 'done'

interface Analysis {
  category: IssueCategory
  severity: Severity
  confidence: number
  box: { x: number; y: number; w: number; h: number }
}

const STEPS = ['Uploading image securely', 'Detecting objects · YOLOv8-civic', 'Classifying severity', 'Reading GPS & reverse-geocoding']

const BOXES: Record<IssueCategory, Analysis['box']> = {
  pothole: { x: 22, y: 38, w: 56, h: 40 },
  garbage: { x: 15, y: 30, w: 70, h: 55 },
  waterlogging: { x: 5, y: 45, w: 90, h: 50 },
  streetlight: { x: 38, y: 8, w: 24, h: 70 },
  traffic: { x: 20, y: 30, w: 60, h: 50 },
}

const KEYWORDS: [IssueCategory, RegExp][] = [
  ['pothole', /pot|hole|road|crack/i],
  ['garbage', /garb|trash|waste|dump|bin/i],
  ['waterlogging', /water|flood|rain|drain/i],
  ['streetlight', /light|lamp|pole|dark/i],
]

function analyze(seedKey: string, known?: IssueCategory): Analysis {
  const rng = createRng(hashString(seedKey))
  const category =
    known ?? KEYWORDS.find(([, re]) => re.test(seedKey))?.[0] ?? REPORTABLE_CATEGORIES[Math.floor(rng() * REPORTABLE_CATEGORIES.length)]
  const severities: Severity[] = category === 'waterlogging' || category === 'pothole' ? ['High', 'High', 'Medium'] : ['Medium', 'High', 'Low']
  return {
    category,
    severity: severities[Math.floor(rng() * severities.length)],
    confidence: +(0.87 + rng() * 0.11).toFixed(2),
    box: BOXES[category],
  }
}

export function ReportPortal() {
  const { cityId, addTicket, draft, setDraft, setView, tickets } = useCivic()
  const city = CITIES[cityId]
  const fileInput = useRef<HTMLInputElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const [phase, setPhase] = useState<Phase>('idle')
  const [step, setStep] = useState(0)
  const [image, setImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [category, setCategory] = useState<IssueCategory | null>(draft?.category ?? null)
  const [severity, setSeverity] = useState<Severity>('Medium')
  const [description, setDescription] = useState(draft?.description ?? '')
  const [location, setLocation] = useState<{ address: string; lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const submitted = submittedId ? tickets.find((t) => t.id === submittedId) ?? null : null
  const myReports = tickets.filter((t) => t.reporter === 'You' && t.city === cityId)

  function mockLocation(seed: string) {
    const rng = createRng(hashString(seed + cityId))
    return { address: randomAddress(city, rng), ...randomCoords(city, rng) }
  }

  function startAnalysis(src: string, seedKey: string, known?: IssueCategory) {
    timers.current.forEach(clearTimeout)
    setImage(src)
    setPhase('analyzing')
    setStep(0)
    setAnalysis(null)
    STEPS.forEach((_, i) => {
      timers.current.push(setTimeout(() => setStep(i + 1), 650 * (i + 1)))
    })
    timers.current.push(
      setTimeout(() => {
        const result = analyze(seedKey, known)
        setAnalysis(result)
        setCategory(result.category)
        setSeverity(result.severity)
        setLocation(mockLocation(seedKey))
        if (!description) {
          setDescription(`${CATEGORIES[result.category].label} detected by AI with ${Math.round(result.confidence * 100)}% confidence.`)
        }
        setPhase('done')
      }, 650 * STEPS.length + 300),
    )
  }

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    startAnalysis(url, `${file.name}-${file.size}`)
  }

  function locateMe() {
    setLocating(true)
    const fallback = () => {
      setLocation(mockLocation(String(Math.random())))
      setLocating(false)
    }
    if (!('geolocation' in navigator)) return fallback()
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const mock = mockLocation(String(pos.coords.latitude))
        setLocation({ address: mock.address, lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5) })
        setLocating(false)
      },
      fallback,
      { timeout: 4000 },
    )
  }

  function reset() {
    timers.current.forEach(clearTimeout)
    setPhase('idle')
    setImage(null)
    setAnalysis(null)
    setCategory(null)
    setDescription('')
    setLocation(null)
    setDraft(null)
  }

  function submit() {
    if (!category) return
    const loc = location ?? mockLocation(String(Date.now()))
    const ticket = addTicket({
      category,
      severity,
      description: description.trim() || `${CATEGORIES[category].label} reported by citizen.`,
      address: loc.address,
      lat: loc.lat,
      lng: loc.lng,
      imageUrl: image ?? undefined,
      source: draft ? 'civicguide' : 'citizen',
    })
    setSubmittedId(ticket.id)
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow={`${city.corporation} · Citizen Portal`}
        title="Report a civic issue in seconds"
        description="Snap or upload a photo. Our AI detects the issue, rates severity, tags your GPS location and routes it to the right department with a guaranteed SLA."
      />

      {draft ? (
        <div className="flex items-start gap-3 rounded-lg border border-accent-foreground/20 bg-accent p-3 text-sm text-accent-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="flex-1">
            Pre-filled by CivicGuide AI. Add a photo for faster verification, or submit directly.
          </p>
          <button type="button" onClick={() => setDraft(null)} aria-label="Dismiss" className="rounded p-0.5 hover:bg-background/40">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <section aria-label="Photo upload and AI analysis" className="flex flex-col gap-4 lg:col-span-3">
          {image ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
              <Image src={image} alt="Uploaded civic issue" fill unoptimized className="object-cover" />
              {phase === 'analyzing' ? (
                <>
                  <div className="absolute inset-0 bg-background/30" />
                  <div className="animate-scan absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_16px_4px] shadow-primary/60" />
                  <div className="absolute inset-x-3 bottom-3 rounded-lg border bg-background/90 p-3 backdrop-blur">
                    <ul className="flex flex-col gap-1.5">
                      {STEPS.map((label, i) => (
                        <li key={label} className="flex items-center gap-2 text-xs">
                          {step > i ? (
                            <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
                          ) : step === i ? (
                            <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden="true" />
                          ) : (
                            <span className="size-3.5 rounded-full border" aria-hidden="true" />
                          )}
                          <span className={cn(step < i && 'text-muted-foreground')}>{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
              {phase === 'done' && analysis ? (
                <>
                  <div
                    className="absolute rounded-md border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]"
                    style={{
                      left: `${analysis.box.x}%`,
                      top: `${analysis.box.y}%`,
                      width: `${analysis.box.w}%`,
                      height: `${analysis.box.h}%`,
                    }}
                  >
                    <span className="absolute -top-6 left-0 rounded bg-primary px-1.5 py-0.5 font-mono text-[11px] font-medium whitespace-nowrap text-primary-foreground">
                      {CATEGORIES[analysis.category].label} · {Math.round(analysis.confidence * 100)}%
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={reset}>
                      <RotateCcw data-icon="inline-start" aria-hidden="true" />
                      Retake
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <label
              htmlFor="issue-photo"
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                handleFile(e.dataTransfer.files[0])
              }}
              className={cn(
                'flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card p-6 text-center transition-colors',
                dragging ? 'border-primary bg-primary/5' : 'hover:border-primary/60 hover:bg-muted/50',
              )}
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ImageUp className="size-6" aria-hidden="true" />
              </span>
              <span className="text-base font-medium">Drag & drop a photo, or tap to capture</span>
              <span className="max-w-sm text-sm text-muted-foreground">
                JPG or PNG. AI auto-detects potholes, garbage, waterlogging and broken streetlights.
              </span>
              <input
                ref={fileInput}
                id="issue-photo"
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">No photo handy? Try a sample:</p>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_PHOTOS.map((s) => (
                <button
                  key={s.src}
                  type="button"
                  onClick={() => startAnalysis(s.src, s.src, s.category)}
                  className="group relative aspect-square overflow-hidden rounded-lg border outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Image src={s.src} alt="" fill sizes="120px" className="object-cover transition-transform group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pt-4 pb-1 text-left text-[11px] font-medium text-white">
                    {CATEGORIES[s.category].label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="details-heading" className="flex flex-col gap-5 rounded-xl border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 id="details-heading" className="font-semibold">
              Complaint details
            </h2>
            {analysis ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <ScanSearch className="size-3" aria-hidden="true" />
                AI verified
              </span>
            ) : null}
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Issue category</legend>
            <div className="grid grid-cols-2 gap-2">
              {REPORTABLE_CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c]
                const active = category === c
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategory(c)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      active ? 'border-primary bg-primary/10 text-foreground' : 'hover:bg-muted',
                    )}
                  >
                    <Icon className={cn('size-4', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
                    {CATEGORIES[c].label}
                  </button>
                )
              })}
            </div>
            {category ? (
              <p className="text-xs text-muted-foreground">
                Routes to <span className="font-medium text-foreground">{CATEGORIES[category].department}</span> · SLA{' '}
                {CATEGORIES[category].slaHours}h
              </p>
            ) : null}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Severity</legend>
            <div className="flex gap-2">
              {(['High', 'Medium', 'Low'] as Severity[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={severity === s}
                  onClick={() => setSeverity(s)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    severity === s ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="issue-desc">Description</Label>
            <Textarea
              id="issue-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anything the field team should know?"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Location</span>
            {location ? (
              <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="flex flex-col">
                  <span>{location.address}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {location.lat}, {location.lng} · GPS tagged
                  </span>
                </div>
              </div>
            ) : null}
            <Button variant="outline" size="sm" onClick={locateMe} disabled={locating} className="self-start">
              {locating ? (
                <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
              ) : (
                <Crosshair data-icon="inline-start" aria-hidden="true" />
              )}
              {location ? 'Update GPS location' : 'Use my current location'}
            </Button>
          </div>

          <Button size="lg" onClick={submit} disabled={!category || phase === 'analyzing'} className="mt-auto">
            <Send data-icon="inline-start" aria-hidden="true" />
            Submit complaint
          </Button>
        </section>
      </div>

      {myReports.length > 0 ? (
        <section aria-labelledby="my-reports" className="flex flex-col gap-3">
          <h2 id="my-reports" className="font-semibold">
            Your reports
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {myReports.map((t) => (
              <MyReportCard key={t.id} ticket={t} />
            ))}
          </div>
        </section>
      ) : null}

      <Dialog open={submitted !== null} onOpenChange={(open) => !open && (setSubmittedId(null), reset())}>
        <DialogContent className="sm:max-w-md">
          {submitted ? (
            <>
              <DialogHeader>
                <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="size-6" aria-hidden="true" />
                </span>
                <DialogTitle>Complaint registered</DialogTitle>
                <DialogDescription>Your ticket is live and assigned. You&apos;ll be notified at every step.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Ticket ID</span>
                  <span className="font-mono text-lg font-semibold">{submitted.id}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Department</span>
                  <span className="text-right text-sm font-medium">{submitted.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge status={submitted.status} />
                </div>
                <SlaCountdown ticket={submitted} />
                <p className="text-xs text-muted-foreground">
                  If unresolved in {submitted.slaHours}h, it auto-escalates to the {city.commissioner}.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => downloadReceipt(submitted)}>
                  <Download data-icon="inline-start" aria-hidden="true" />
                  e-Receipt
                </Button>
                <Button
                  onClick={() => {
                    setSubmittedId(null)
                    reset()
                    setView('tracker')
                  }}
                >
                  Track ticket
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MyReportCard({ ticket }: { ticket: Ticket }) {
  const Icon = CATEGORY_ICONS[ticket.category]
  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Icon className="size-4 text-primary" aria-hidden="true" />
          <span className="font-mono text-sm font-medium">{ticket.id}</span>
        </span>
        <SeverityBadge severity={ticket.severity} />
      </div>
      <StatusBadge status={ticket.status} className="self-start" />
      <p className="line-clamp-1 text-xs text-muted-foreground">
        {ticket.address} · {formatDateTime(ticket.createdAt)}
      </p>
      <SlaCountdown ticket={ticket} />
    </article>
  )
}
