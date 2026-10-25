'use client'

import { Bell, Building2, Check, ChevronDown, Languages, MapPin, Moon, ShieldCheck, Sun, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { CITIES, CITY_LIST, LANGUAGES, NAV_LABELS } from '@/lib/civic/data'
import { formatClock, formatDateTime } from '@/lib/civic/format'
import type { Role, ViewId } from '@/lib/civic/types'
import { useCivic } from './civic-provider'

const NAV: Record<Role, ViewId[]> = {
  citizen: ['report', 'guide', 'tracker'],
  authority: ['surveillance', 'tracker', 'analytics'],
}

const NOTIFICATION_TONE = {
  info: 'bg-info',
  warning: 'bg-warning',
  success: 'bg-success',
  escalation: 'bg-destructive',
} as const

const triggerClass =
  'inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 outline-none'

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle color theme"
    >
      <Sun className="hidden dark:block" aria-hidden="true" />
      <Moon className="block dark:hidden" aria-hidden="true" />
    </Button>
  )
}

function RoleToggle() {
  const { role, setRole } = useCivic()
  const options: { id: Role; label: string; icon: typeof User }[] = [
    { id: 'citizen', label: 'Citizen', icon: User },
    { id: 'authority', label: 'Authority', icon: ShieldCheck },
  ]
  return (
    <div role="radiogroup" aria-label="Portal view" className="flex items-center rounded-md border bg-muted p-0.5">
      {options.map((opt) => {
        const active = role === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setRole(opt.id)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <opt.icon className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function NotificationsMenu() {
  const { notifications, markAllRead } = useCivic()
  const unread = notifications.filter((n) => !n.read).length
  return (
    <DropdownMenu onOpenChange={(open) => !open && unread > 0 && markAllRead()}>
      <DropdownMenuTrigger className={cn(triggerClass, 'relative w-8 justify-center px-0')} aria-label={`Notifications, ${unread} unread`}>
        <Bell className="size-4" aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">Notifications</span>
          <span className="text-xs text-muted-foreground">{unread} new</span>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="flex gap-2.5 rounded-md px-2 py-2 hover:bg-muted">
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', NOTIFICATION_TONE[n.kind])} aria-hidden="true" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className={cn('text-sm', !n.read && 'font-semibold')}>{n.title}</span>
                  <span className="text-xs text-muted-foreground text-pretty">{n.body}</span>
                  <span className="text-[11px] text-muted-foreground">{formatDateTime(n.at)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppHeader() {
  const { role, view, setView, language, setLanguage, cityId, setCityId, now } = useCivic()
  const city = CITIES[cityId]
  const lang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0]
  const labels = NAV_LABELS[language]

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold">CivicFix</span>
            <span className="text-[11px] text-muted-foreground">{city.corporation} Smart City</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className={triggerClass} aria-label={`City: ${city.name}`}>
            <MapPin className="size-3.5 text-primary" aria-hidden="true" />
            <span>{city.name}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52">
            {CITY_LIST.map((c) => (
              <DropdownMenuItem key={c.id} onClick={() => setCityId(c.id)}>
                <span className="flex-1">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.corporation}</span>
                {c.id === cityId ? <Check className="size-3.5 text-primary" aria-hidden="true" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs text-muted-foreground tabular-nums lg:inline-flex">
            <span className="size-1.5 animate-pulse rounded-full bg-success" aria-hidden="true" />
            IST {now === null ? '--:--:--' : formatClock(now)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger className={triggerClass} aria-label={`Language: ${lang.label}`}>
              <Languages className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{lang.native}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {LANGUAGES.map((l) => (
                <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code)}>
                  <span className="flex-1">{l.native}</span>
                  <span className="text-xs text-muted-foreground">{l.label}</span>
                  {l.code === language ? <Check className="size-3.5 text-primary" aria-hidden="true" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <RoleToggle />
          <NotificationsMenu />
          <ThemeToggle />
        </div>
      </div>

      <nav aria-label="Primary" className="mx-auto max-w-7xl overflow-x-auto px-4">
        <ul className="flex items-center gap-1">
          {NAV[role].map((id) => {
            const active = view === id
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setView(id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative inline-flex h-10 items-center px-3 text-sm whitespace-nowrap transition-colors outline-none focus-visible:text-foreground',
                    active ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {labels[id]}
                  {active ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
