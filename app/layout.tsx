import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import {
  Geist,
  Geist_Mono,
  Noto_Sans_Devanagari,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from 'next/font/google'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

// Indic fallbacks load only when their glyphs appear (unicode-range), so Latin pages stay light.
const devanagari = Noto_Sans_Devanagari({
  weight: ['400', '600'],
  preload: false,
  display: 'swap',
  subsets: ['devanagari'],
  variable: '--font-devanagari',
})
const telugu = Noto_Sans_Telugu({
  weight: ['400', '600'],
  preload: false,
  display: 'swap',
  subsets: ['telugu'],
  variable: '--font-telugu',
})
const kannada = Noto_Sans_Kannada({
  weight: ['400', '600'],
  preload: false,
  display: 'swap',
  subsets: ['kannada'],
  variable: '--font-kannada',
})
const tamil = Noto_Sans_Tamil({
  weight: ['400', '600'],
  preload: false,
  display: 'swap',
  subsets: ['tamil'],
  variable: '--font-tamil',
})
const malayalam = Noto_Sans_Malayalam({
  weight: ['400', '600'],
  preload: false,
  display: 'swap',
  subsets: ['malayalam'],
  variable: '--font-malayalam',
})

const fontVariables = [geistSans, geistMono, devanagari, telugu, kannada, tamil, malayalam].map((f) => f.variable).join(' ')

export const metadata: Metadata = {
  title: 'CivicFix — AI Smart City Complaints & Surveillance',
  description:
    'Report potholes, garbage, waterlogging and streetlight issues with AI detection, multilingual CivicGuide assistant, smart CCTV violation detection, SLA tracking and auto-escalation.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
