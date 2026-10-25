import { CITIES } from './data'
import type { CityId } from './types'

export function formatCountdown(ms: number) {
  const negative = ms < 0
  const total = Math.floor(Math.abs(ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const body = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return negative ? `-${body}` : body
}

export function formatHours(ms: number) {
  const hours = ms / 3_600_000
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`
  if (hours < 48) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export function formatDateTime(ts: number) {
  return dateTimeFormatter.format(ts)
}

export function formatClock(ts: number) {
  return timeFormatter.format(ts)
}

export function mapPosition(cityId: CityId, lat: number, lng: number) {
  const { center } = CITIES[cityId]
  const x = ((lng - center.lng + 0.08) / 0.16) * 100
  const y = (1 - (lat - center.lat + 0.06) / 0.12) * 100
  return { x: Math.min(97, Math.max(3, x)), y: Math.min(95, Math.max(5, y)) }
}
