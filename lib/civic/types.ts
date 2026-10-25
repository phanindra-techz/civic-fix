export type Role = 'citizen' | 'authority'

export type LanguageCode = 'en' | 'te' | 'hi' | 'kn' | 'ta' | 'ml' | 'mr'

export type CityId = 'hyderabad' | 'bengaluru' | 'chennai' | 'mumbai' | 'kochi' | 'pune'

export type IssueCategory = 'pothole' | 'garbage' | 'waterlogging' | 'streetlight' | 'traffic'

export type Severity = 'High' | 'Medium' | 'Low'

export type TicketStatus = 'reported' | 'assigned' | 'in_progress' | 'escalated' | 'resolved'

export type ViewId = 'report' | 'guide' | 'surveillance' | 'tracker' | 'analytics'

export interface TicketEvent {
  at: number
  label: string
  actor: string
  kind: 'info' | 'warning' | 'success' | 'escalation'
}

export interface Ticket {
  id: string
  city: CityId
  category: IssueCategory
  severity: Severity
  description: string
  address: string
  lat: number
  lng: number
  department: string
  status: TicketStatus
  createdAt: number
  slaHours: number
  deadline: number
  escalatedTo?: string
  resolvedAt?: number
  reporter: string
  imageUrl?: string
  source: 'citizen' | 'cctv' | 'civicguide'
  history: TicketEvent[]
}

export type ViolationType =
  | 'No Helmet'
  | 'Red-light Jumping'
  | 'Triple Riding'
  | 'Wrong-side Driving'
  | 'Overflowing Garbage'
  | 'Road Flooding'

export interface DetectionBox {
  type: ViolationType
  x: number
  y: number
  w: number
  h: number
}

export interface Camera {
  id: string
  name: string
  image: string
  boxes: DetectionBox[]
}

export type DetectionStatus = 'pending' | 'approved' | 'rejected'

export interface DetectionEvent {
  id: string
  cameraId: string
  cameraName: string
  image: string
  box: DetectionBox
  plate?: string
  confidence: number
  at: number
  status: DetectionStatus
  challanId?: string
  fine?: number
  ticketId?: string
}

export interface AppNotification {
  id: string
  title: string
  body: string
  at: number
  kind: 'info' | 'warning' | 'success' | 'escalation'
  read: boolean
}

export interface ReportDraft {
  category?: IssueCategory
  description?: string
}
