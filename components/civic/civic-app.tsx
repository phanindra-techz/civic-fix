'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { AnalyticsDashboard } from './analytics-dashboard'
import { AppHeader } from './app-header'
import { CivicGuide } from './civic-guide'
import { CivicProvider, useCivic } from './civic-provider'
import { IncidentTracker } from './incident-tracker'
import { ReportPortal } from './report-portal'
import { SurveillanceConsole } from './surveillance-console'

function ActiveView() {
  const { view } = useCivic()
  switch (view) {
    case 'report':
      return <ReportPortal />
    case 'guide':
      return <CivicGuide />
    case 'surveillance':
      return <SurveillanceConsole />
    case 'tracker':
      return <IncidentTracker />
    case 'analytics':
      return <AnalyticsDashboard />
  }
}

export function CivicApp() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <CivicProvider>
        <div className="min-h-dvh bg-background">
          <AppHeader />
          <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
            <ActiveView />
          </main>
          <footer className="border-t">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
              <span>CivicFix · AI-powered Smart City complaint & surveillance platform</span>
              <span>Demo data · Hyderabad · Bengaluru · Chennai · Mumbai · Delhi</span>
            </div>
          </footer>
        </div>
        <Toaster position="bottom-right" richColors />
      </CivicProvider>
    </ThemeProvider>
  )
}
