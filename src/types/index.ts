export type TicketStatus = string   // Dynamic — configured per tenant via ticket_statuses table
export type SLAStatus = 'on_track' | 'at_risk' | 'breached'
export type UserRole = 'admin' | 'agent' | 'super_admin'
export type MessageDirection = 'inbound' | 'outbound'
export type AlertRecipient = 'agent' | 'admin'
export type TicketChannel = 'email' | 'whatsapp' | 'phone'

export interface Tenant {
  id:      string
  name:    string
  slug:    string
  logoUrl?: string
  plan:    string
}

export interface User {
  id:       string
  name:     string
  email:    string
  role:     UserRole
  avatar?:  string
  enabled:  boolean
  online?:    boolean
  extension?: string | null   // phone extension for click-to-call
  tenantId: string
  tenant?:  Tenant
  createdAt:      string
  signature?:     string
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

// ── Settings ──────────────────────────────────────────────────

export interface EmailSettings {
  provider:      'graph' | 'resend'
  fromEmail:     string
  fromName:      string
  replyToDomain: string
  msTenantId:    string
  msClientId:    string
  msClientSecret: string   // returned as '••••••••' when set
}

export interface WhatsAppSettings {
  accountSid: string
  authToken:  string       // returned as '••••••••' when set
  fromNumber: string
}

export interface GeneralSettings {
  companyName: string
  supportUrl:  string
}

export interface SettingsCategory<T = Record<string, string>> {
  category:  string
  data:      T
  updatedAt: string | null
}

export interface KPIData {
  totalOpen: number
  atRisk: number
  breached: number
  avgResponseMinutes: number
}

export interface AgentSession {
  start:   string
  end:     string | null
  minutes: number
}

export interface AgentDailyBreakdown {
  date:    string
  label:   string
  minutes: number
  hours:   number
}

export interface AgentHoursRow {
  userId:            string
  name:              string
  email:             string
  totalMinutes:      number
  totalHours:        number
  sessionCount:      number
  avgSessionMinutes: number
  firstLogin:        string | null
  lastLogin:         string | null
  sessions:          AgentSession[]
  dailyBreakdown:    AgentDailyBreakdown[]
}

export interface AgentHoursReport {
  dateRange: string[]
  agents:    AgentHoursRow[]
}

// ── Tenant (with stats for super-admin view) ──────────────────────────────

export interface TenantWithStats extends Tenant {
  userCount:   number
  ticketCount: number
}

// ── Ticket config (per-tenant) ─────────────────────────────────────────────

export interface TicketStatusDef {
  id:         string
  name:       string    // stored in tickets.status  (e.g. 'open')
  label:      string    // display label             (e.g. 'Open')
  color:      string    // hex badge colour           (e.g. '#3B82F6')
  sortOrder:  number
  isDefault:  boolean   // applied automatically to new tickets
  isResolved: boolean   // ticket is considered closed when in this status
}

export interface TicketTypeDef {
  id:        string
  name:      string     // stored in tickets.ticket_type
  label:     string
  color:     string
  sortOrder: number
}

// ── Phone channel ──────────────────────────────────────────────────────────

export type CallDirection = 'inbound' | 'outbound'
export type CallStatus    = 'ringing' | 'in_progress' | 'completed' | 'missed' | 'failed'

export interface Call {
  id:              string
  tenantId:        string
  ticketId:        string | null
  direction:       CallDirection
  status:          CallStatus
  callerNumber:    string | null
  calleeNumber:    string | null
  agentExtension:  string | null
  agentId:         string | null
  durationSeconds: number | null
  recordingUrl:    string | null
  pbxCallId:       string | null
  startedAt:       string
  answeredAt:      string | null
  endedAt:         string | null
  users?:          { name: string } | null   // joined agent name
}

export interface PhoneSettings {
  id:             string
  enabled:        boolean
  pbxLabel:       string
  dialUrl:        string | null
  dialAuthHeader: string | null   // masked as '••••••••' when set
  webhookSecret:  string | null   // masked as '••••••••' when set
}

// ── Reports ────────────────────────────────────────────────────────────────

export interface DailyRow {
  isoDate: string
  label: string
  breaches: number
  atRisk: number
  avgMins: number
  resolved: number
  total: number
}
