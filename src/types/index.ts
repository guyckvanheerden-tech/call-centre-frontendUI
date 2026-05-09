export type TicketStatus = 'open' | 'pending' | 'waiting_3rd_party' | 'resolved'
export type SLAStatus = 'on_track' | 'at_risk' | 'breached'
export type UserRole = 'admin' | 'agent'
export type MessageDirection = 'inbound' | 'outbound'
export type AlertRecipient = 'agent' | 'admin'
export type TicketChannel = 'email' | 'whatsapp'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  enabled: boolean
  online?: boolean
  createdAt: string
  signature?: string
  signatureImage?: string  // base64 data URL
}

export interface Domain {
  id: string
  name: string
  slaPolicyId: string
  priority: number
}

export interface SLAPolicy {
  id: string
  name: string
  firstResponseMinutes: number
  resolutionMinutes: number
  businessHoursOnly: boolean
}

export interface NotificationThreshold {
  id: string
  percentage: number
  recipients: AlertRecipient[]
  enabled: boolean
}

export interface NotificationSettings {
  policyId: string
  atRisk: {
    enabled: boolean
    thresholds: NotificationThreshold[]
  }
  breach: {
    enabled: boolean
    recipients: AlertRecipient[]
  }
  reminder: {
    enabled: boolean
    intervalMinutes: number
    maxCount: number | null
    recipients: AlertRecipient[]
  }
}

export interface TicketMessage {
  id: string
  ticketId: string
  direction: MessageDirection
  from: string
  body: string
  channel: TicketChannel
  createdAt: string
}

export interface Ticket {
  id: string
  subject: string
  customerEmail: string
  customerPhone: string | null
  channel: TicketChannel
  domain: string
  domainId: string
  status: TicketStatus
  slaStatus: SLAStatus
  slaPolicy: string
  assignedAgent: string | null
  assignedAgentId: string | null
  ticketType?: string
  firstResponseDue: string
  resolutionDue: string
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
  tags: string[]
}

export interface KPIData {
  totalOpen: number
  atRisk: number
  breached: number
  avgResponseMinutes: number
}

export interface DailyRow {
  isoDate: string
  label: string
  breaches: number
  atRisk: number
  avgMins: number
  resolved: number
  total: number
}
