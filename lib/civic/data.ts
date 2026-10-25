import type {
  Camera,
  CityId,
  IssueCategory,
  LanguageCode,
  Severity,
  Ticket,
  TicketEvent,
  TicketStatus,
  ViewId,
} from './types'

export const DEMO_ANCHOR = Date.UTC(2026, 9, 25, 3, 30, 0)
export const HOUR = 3_600_000

export function createRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface CityMeta {
  id: CityId
  name: string
  code: string
  corporation: string
  commissioner: string
  plateState: string
  center: { lat: number; lng: number }
  localities: string[]
}

export const CITIES: Record<CityId, CityMeta> = {
  hyderabad: {
    id: 'hyderabad',
    name: 'Hyderabad',
    code: 'HYD',
    corporation: 'GHMC',
    commissioner: 'GHMC Commissioner',
    plateState: 'TS',
    center: { lat: 17.385, lng: 78.4867 },
    localities: ['Ameerpet', 'Kukatpally', 'Madhapur', 'Begumpet', 'Dilsukhnagar', 'Secunderabad', 'Banjara Hills', 'Gachibowli'],
  },
  bengaluru: {
    id: 'bengaluru',
    name: 'Bengaluru',
    code: 'BLR',
    corporation: 'BBMP',
    commissioner: 'BBMP Chief Commissioner',
    plateState: 'KA',
    center: { lat: 12.9716, lng: 77.5946 },
    localities: ['Indiranagar', 'Koramangala', 'Jayanagar', 'Whitefield', 'HSR Layout', 'Malleshwaram', 'Hebbal', 'Marathahalli'],
  },
  chennai: {
    id: 'chennai',
    name: 'Chennai',
    code: 'CHN',
    corporation: 'GCC',
    commissioner: 'GCC Commissioner',
    plateState: 'TN',
    center: { lat: 13.0827, lng: 80.2707 },
    localities: ['T. Nagar', 'Adyar', 'Velachery', 'Anna Nagar', 'Mylapore', 'Guindy', 'Tambaram', 'Porur'],
  },
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai',
    code: 'MUM',
    corporation: 'BMC',
    commissioner: 'BMC Municipal Commissioner',
    plateState: 'MH',
    center: { lat: 19.076, lng: 72.8777 },
    localities: ['Andheri', 'Dadar', 'Bandra', 'Kurla', 'Borivali', 'Chembur', 'Ghatkopar', 'Powai'],
  },
  kochi: {
    id: 'kochi',
    name: 'Kochi',
    code: 'KOC',
    corporation: 'Kochi Corporation',
    commissioner: 'Kochi Corporation Secretary',
    plateState: 'KL',
    center: { lat: 9.9312, lng: 76.2673 },
    localities: ['Edappally', 'Kaloor', 'Vyttila', 'Fort Kochi', 'Kakkanad', 'Palarivattom', 'Thrippunithura', 'Ernakulam South'],
  },
  pune: {
    id: 'pune',
    name: 'Pune',
    code: 'PUN',
    corporation: 'PMC',
    commissioner: 'PMC Municipal Commissioner',
    plateState: 'MH',
    center: { lat: 18.5204, lng: 73.8567 },
    localities: ['Kothrud', 'Shivajinagar', 'Hadapsar', 'Baner', 'Viman Nagar', 'Aundh', 'Wakad', 'Swargate'],
  },
}

export const CITY_LIST = Object.values(CITIES)

export interface CategoryMeta {
  id: IssueCategory
  label: string
  department: string
  shortDept: string
  slaHours: number
}

export const CATEGORIES: Record<IssueCategory, CategoryMeta> = {
  pothole: { id: 'pothole', label: 'Pothole', department: 'Roads & Buildings Dept.', shortDept: 'R&B', slaHours: 48 },
  garbage: { id: 'garbage', label: 'Garbage', department: 'Solid Waste Management', shortDept: 'SWM', slaHours: 24 },
  waterlogging: { id: 'waterlogging', label: 'Waterlogging', department: 'Storm Water Drainage', shortDept: 'SWD', slaHours: 12 },
  streetlight: { id: 'streetlight', label: 'Streetlight', department: 'Electrical – Street Lighting', shortDept: 'ELEC', slaHours: 48 },
  traffic: { id: 'traffic', label: 'Traffic', department: 'Traffic Police', shortDept: 'TRAFFIC', slaHours: 24 },
}

export const REPORTABLE_CATEGORIES: IssueCategory[] = ['pothole', 'garbage', 'waterlogging', 'streetlight']

export const SAMPLE_PHOTOS: { category: IssueCategory; src: string }[] = [
  { category: 'pothole', src: '/samples/pothole.png' },
  { category: 'garbage', src: '/samples/garbage.png' },
  { category: 'waterlogging', src: '/samples/waterlogging.png' },
  { category: 'streetlight', src: '/samples/streetlight.png' },
]

export const STATUS_META: Record<TicketStatus, { label: string; tone: string; dot: string }> = {
  reported: { label: 'Reported', tone: 'bg-muted text-foreground', dot: 'bg-muted-foreground' },
  assigned: { label: 'Assigned to Authority', tone: 'bg-info/15 text-info', dot: 'bg-info' },
  in_progress: { label: 'In Progress', tone: 'bg-warning/15 text-warning', dot: 'bg-warning' },
  escalated: { label: 'Escalated (Missed SLA)', tone: 'bg-destructive/15 text-destructive', dot: 'bg-destructive' },
  resolved: { label: 'Resolved', tone: 'bg-success/15 text-success', dot: 'bg-success' },
}

export const STATUS_ORDER: TicketStatus[] = ['reported', 'assigned', 'in_progress', 'escalated', 'resolved']

export const SEVERITY_TONE: Record<Severity, string> = {
  High: 'bg-destructive/15 text-destructive',
  Medium: 'bg-warning/15 text-warning',
  Low: 'bg-success/15 text-success',
}

const DESCRIPTIONS: Record<IssueCategory, string[]> = {
  pothole: [
    'Deep pothole near the bus stop, two-wheelers swerving dangerously.',
    'Series of potholes after last week’s rain, causing traffic slowdown.',
    'Road caved in near the junction; water collects every evening.',
  ],
  garbage: [
    'Garbage bin overflowing for 3 days, stray dogs spreading waste.',
    'Construction debris dumped on footpath, blocking pedestrians.',
    'Missed door-to-door collection in the entire lane this week.',
  ],
  waterlogging: [
    'Knee-deep water at the underpass after 30 minutes of rain.',
    'Blocked storm drain causing water to enter ground-floor shops.',
    'Stagnant water near school gate, mosquito breeding risk.',
  ],
  streetlight: [
    'Streetlight not working for a week, lane completely dark at night.',
    'Three consecutive poles off near the park, safety concern for women.',
    'Flickering light with exposed wiring at the base of the pole.',
  ],
  traffic: [
    'Signal timer malfunctioning, constant gridlock at peak hours.',
    'Vehicles parked on both sides blocking ambulance access.',
    'Frequent wrong-side driving on the service road.',
  ],
}

const STREETS = ['Main Road', '1st Cross', 'Station Road', 'Market Street', 'Ring Road', 'Temple Street', 'Lake View Road', '5th Avenue']
const REPORTERS = ['Ravi K.', 'Priya S.', 'Arjun M.', 'Lakshmi N.', 'Farhan A.', 'Sneha R.', 'Vikram T.', 'Divya P.', 'Kiran B.', 'Meera J.']

export const LOWER_DIVISION: Record<IssueCategory, string> = {
  pothole: 'Ward Engineer (R&B)',
  garbage: 'Sanitary Inspector (SWM)',
  waterlogging: 'Asst. Engineer (SWD)',
  streetlight: 'Line Inspector (Electrical)',
  traffic: 'Traffic Sub-Inspector',
}

export function randomAddress(city: CityMeta, rng: () => number) {
  const loc = city.localities[Math.floor(rng() * city.localities.length)]
  const street = STREETS[Math.floor(rng() * STREETS.length)]
  const no = 1 + Math.floor(rng() * 240)
  return `${no}, ${street}, ${loc}, ${city.name}`
}

export function randomCoords(city: CityMeta, rng: () => number) {
  return {
    lat: +(city.center.lat + (rng() - 0.5) * 0.12).toFixed(5),
    lng: +(city.center.lng + (rng() - 0.5) * 0.16).toFixed(5),
  }
}

export function ticketId(city: CityMeta, n: number) {
  return `CF-${city.code}-${String(n).padStart(5, '0')}`
}

function buildHistory(
  category: IssueCategory,
  status: TicketStatus,
  createdAt: number,
  deadline: number,
  commissioner: string,
  reporter: string,
  resolvedAt?: number,
): TicketEvent[] {
  const meta = CATEGORIES[category]
  const events: TicketEvent[] = [
    { at: createdAt, label: `Complaint filed by ${reporter}`, actor: 'Citizen', kind: 'info' },
    { at: createdAt + 60_000, label: `AI verified & routed to ${meta.department}`, actor: 'CivicFix AI', kind: 'info' },
  ]
  if (status === 'reported') return events
  events.push({ at: createdAt + 0.5 * HOUR, label: `Assigned to ${LOWER_DIVISION[category]}`, actor: meta.shortDept, kind: 'info' })
  if (status === 'assigned') return events
  if (status === 'escalated') {
    events.push({
      at: deadline,
      label: `SLA of ${meta.slaHours}h breached – auto-escalated to ${commissioner}`,
      actor: 'Auto-Escalation Engine',
      kind: 'escalation',
    })
    events.push({
      at: deadline + 60_000,
      label: `Accountability complaint raised against ${LOWER_DIVISION[category]}`,
      actor: 'Auto-Escalation Engine',
      kind: 'warning',
    })
    return events
  }
  events.push({ at: createdAt + 2 * HOUR, label: 'Field crew dispatched, work in progress', actor: meta.shortDept, kind: 'info' })
  if (status === 'in_progress') return events
  events.push({ at: resolvedAt ?? createdAt + 6 * HOUR, label: 'Resolved – proof-of-fix photo uploaded', actor: meta.shortDept, kind: 'success' })
  return events
}

export function makeTicket(params: {
  city: CityMeta
  n: number
  category: IssueCategory
  severity: Severity
  status: TicketStatus
  createdAt: number
  description: string
  address: string
  lat: number
  lng: number
  reporter: string
  source: Ticket['source']
  imageUrl?: string
  deadlineOverride?: number
  resolvedAt?: number
}): Ticket {
  const meta = CATEGORIES[params.category]
  const deadline = params.deadlineOverride ?? params.createdAt + meta.slaHours * HOUR
  return {
    id: ticketId(params.city, params.n),
    city: params.city.id,
    category: params.category,
    severity: params.severity,
    description: params.description,
    address: params.address,
    lat: params.lat,
    lng: params.lng,
    department: meta.department,
    status: params.status,
    createdAt: params.createdAt,
    slaHours: meta.slaHours,
    deadline,
    escalatedTo: params.status === 'escalated' ? params.city.commissioner : undefined,
    resolvedAt: params.resolvedAt,
    reporter: params.reporter,
    imageUrl: params.imageUrl,
    source: params.source,
    history: buildHistory(
      params.category,
      params.status,
      params.createdAt,
      deadline,
      params.city.commissioner,
      params.reporter,
      params.resolvedAt,
    ),
  }
}

export function generateCityTickets(cityId: CityId): Ticket[] {
  const city = CITIES[cityId]
  const rng = createRng(hashString(cityId))
  const categories: IssueCategory[] = ['pothole', 'pothole', 'garbage', 'garbage', 'waterlogging', 'streetlight', 'traffic']
  const severities: Severity[] = ['High', 'Medium', 'Medium', 'Low']
  const tickets: Ticket[] = []
  const count = 34

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(rng() * categories.length)]
    const meta = CATEGORIES[category]
    const hoursAgo = 1 + rng() * 160
    const createdAt = DEMO_ANCHOR - hoursAgo * HOUR
    const deadline = createdAt + meta.slaHours * HOUR
    const roll = rng()
    let status: TicketStatus
    let resolvedAt: number | undefined
    if (roll < 0.42) {
      status = 'resolved'
      resolvedAt = createdAt + Math.min(hoursAgo, meta.slaHours * (0.3 + rng() * 0.9)) * HOUR
    } else if (DEMO_ANCHOR > deadline) {
      status = 'escalated'
    } else {
      status = (['reported', 'assigned', 'in_progress'] as const)[Math.floor(rng() * 3)]
    }
    const coords = randomCoords(city, rng)
    tickets.push(
      makeTicket({
        city,
        n: 10400 + i * 7,
        category,
        severity: severities[Math.floor(rng() * severities.length)],
        status,
        createdAt,
        description: DESCRIPTIONS[category][Math.floor(rng() * 3)],
        address: randomAddress(city, rng),
        ...coords,
        reporter: REPORTERS[Math.floor(rng() * REPORTERS.length)],
        source: rng() < 0.2 ? 'cctv' : 'citizen',
        resolvedAt,
      }),
    )
  }

  const coords = randomCoords(city, rng)
  tickets.push(
    makeTicket({
      city,
      n: 10399,
      category: 'pothole',
      severity: 'High',
      status: 'assigned',
      createdAt: DEMO_ANCHOR - 47.97 * HOUR,
      deadlineOverride: DEMO_ANCHOR + 100_000,
      description: 'Large pothole at the flyover ramp – no action for nearly 2 days.',
      address: randomAddress(city, rng),
      ...coords,
      reporter: 'Anitha V.',
      source: 'citizen',
    }),
  )

  return tickets.sort((a, b) => b.createdAt - a.createdAt)
}

export function generateAllTickets(): Ticket[] {
  return CITY_LIST.flatMap((c) => generateCityTickets(c.id))
}

export const CAMERAS: Camera[] = [
  {
    id: 'cam-4b',
    name: 'Junction 4B',
    image: '/cctv/junction.png',
    boxes: [
      { type: 'No Helmet', x: 0.405, y: 0.68, w: 0.05, h: 0.17 },
      { type: 'Red-light Jumping', x: 0.135, y: 0.34, w: 0.05, h: 0.08 },
      { type: 'Wrong-side Driving', x: 0.635, y: 0.62, w: 0.11, h: 0.17 },
    ],
  },
  {
    id: 'cam-ms',
    name: 'Market Square',
    image: '/cctv/market.png',
    boxes: [
      { type: 'Overflowing Garbage', x: 0.58, y: 0.61, w: 0.3, h: 0.3 },
      { type: 'No Helmet', x: 0.485, y: 0.59, w: 0.06, h: 0.23 },
      { type: 'No Helmet', x: 0.36, y: 0.55, w: 0.07, h: 0.2 },
    ],
  },
  {
    id: 'cam-rr',
    name: 'Ring Road – Km 12',
    image: '/cctv/ringroad.png',
    boxes: [
      { type: 'Triple Riding', x: 0.58, y: 0.66, w: 0.045, h: 0.16 },
      { type: 'Wrong-side Driving', x: 0.41, y: 0.66, w: 0.033, h: 0.12 },
      { type: 'No Helmet', x: 0.272, y: 0.56, w: 0.03, h: 0.1 },
    ],
  },
  {
    id: 'cam-up',
    name: 'Railway Underpass',
    image: '/cctv/underpass.png',
    boxes: [
      { type: 'Road Flooding', x: 0.29, y: 0.5, w: 0.68, h: 0.46 },
      { type: 'No Helmet', x: 0.77, y: 0.58, w: 0.12, h: 0.27 },
    ],
  },
]

export const VIOLATION_META: Record<
  string,
  { kind: 'traffic' | 'civic'; fine?: number; color: string; category?: IssueCategory }
> = {
  'No Helmet': { kind: 'traffic', fine: 1000, color: '#f59e0b' },
  'Red-light Jumping': { kind: 'traffic', fine: 5000, color: '#ef4444' },
  'Triple Riding': { kind: 'traffic', fine: 1000, color: '#f97316' },
  'Wrong-side Driving': { kind: 'traffic', fine: 5000, color: '#ef4444' },
  'Overflowing Garbage': { kind: 'civic', color: '#10b981', category: 'garbage' },
  'Road Flooding': { kind: 'civic', color: '#6366f1', category: 'waterlogging' },
}

export function randomPlate(state: string, rng: () => number = Math.random) {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ'
  const rto = String(1 + Math.floor(rng() * 40)).padStart(2, '0')
  const l = letters[Math.floor(rng() * letters.length)] + letters[Math.floor(rng() * letters.length)]
  const n = String(1000 + Math.floor(rng() * 8999))
  return `${state}-${rto}-${l}-${n}`
}

export const LANGUAGES: { code: LanguageCode; label: string; native: string; speech: string }[] = [
  { code: 'en', label: 'English', native: 'English', speech: 'en-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', speech: 'te-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', speech: 'hi-IN' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', speech: 'kn-IN' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', speech: 'ta-IN' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', speech: 'ml-IN' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', speech: 'mr-IN' },
]

export const NAV_LABELS: Record<LanguageCode, Record<ViewId, string>> = {
  en: { report: 'Quick Report', guide: 'CivicGuide AI', surveillance: 'Smart CCTV', tracker: 'Incident Tracker', analytics: 'Analytics' },
  te: { report: 'త్వరిత ఫిర్యాదు', guide: 'సివిక్‌గైడ్ AI', surveillance: 'స్మార్ట్ CCTV', tracker: 'ఫిర్యాదుల ట్రాకర్', analytics: 'విశ్లేషణ' },
  hi: { report: 'त्वरित शिकायत', guide: 'सिविकगाइड AI', surveillance: 'स्मार्ट CCTV', tracker: 'शिकायत ट्रैकर', analytics: 'विश्लेषण' },
  kn: { report: 'ತ್ವರಿತ ದೂರು', guide: 'ಸಿವಿಕ್‌ಗೈಡ್ AI', surveillance: 'ಸ್ಮಾರ್ಟ್ CCTV', tracker: 'ದೂರು ಟ್ರ್ಯಾಕರ್', analytics: 'ವಿಶ್ಲೇಷಣೆ' },
  ta: { report: 'விரைவு புகார்', guide: 'சிவிக்கைடு AI', surveillance: 'ஸ்மார்ட் CCTV', tracker: 'புகார் கண்காணிப்பு', analytics: 'பகுப்பாய்வு' },
  ml: { report: 'ദ്രുത പരാതി', guide: 'സിവിക്‌ഗൈഡ് AI', surveillance: 'സ്മാർട്ട് CCTV', tracker: 'പരാതി ട്രാക്കർ', analytics: 'വിശകലനം' },
  mr: { report: 'त्वरित तक्रार', guide: 'सिविकगाइड AI', surveillance: 'स्मार्ट CCTV', tracker: 'तक्रार ट्रॅकर', analytics: 'विश्लेषण' },
}
