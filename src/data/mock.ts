import type {
  Ticket, User, SLAPolicy, Domain, NotificationSettings, KPIData
} from '@/types'

export const mockUsers: User[] = [
  {
    id: 'u1', name: 'Alice Nkosi', email: 'alice@company.com', role: 'admin', enabled: true, online: true, createdAt: '2024-01-10T09:00:00Z',
    signature: 'Kind regards,\nAlice Nkosi\nSupport Manager | SupportDesk\nalice@company.com | +27 11 000 0001\nwww.supportdesk.co.za',
  },
  {
    id: 'u2', name: 'Ben Pretorius', email: 'ben@company.com', role: 'agent', enabled: true, online: true, createdAt: '2024-01-15T09:00:00Z',
    signature: 'Best regards,\nBen Pretorius\nSupport Agent | SupportDesk\nben@company.com | +27 11 000 0002',
  },
  {
    id: 'u3', name: 'Cara Williams', email: 'cara@company.com', role: 'agent', enabled: true, online: true, createdAt: '2024-02-01T09:00:00Z',
    signature: 'Warm regards,\nCara Williams\nSupport Agent | SupportDesk\ncara@company.com | +27 11 000 0003',
  },
  {
    id: 'u4', name: 'David Mokoena', email: 'david@company.com', role: 'agent', enabled: true, online: false, createdAt: '2024-02-10T09:00:00Z',
    signature: 'Regards,\nDavid Mokoena\nSupport Agent | SupportDesk\ndavid@company.com | +27 11 000 0004',
  },
  {
    id: 'u5', name: 'Emma Johnson', email: 'emma@company.com', role: 'agent', enabled: false, online: false, createdAt: '2024-03-01T09:00:00Z',
    signature: 'Regards,\nEmma Johnson\nSupport Agent | SupportDesk\nemma@company.com',
  },
  {
    id: 'u6', name: 'Frank Dlamini', email: 'frank@company.com', role: 'agent', enabled: true, online: false, createdAt: '2024-03-15T09:00:00Z',
  },
]

export const mockSLAPolicies: SLAPolicy[] = [
  { id: 'p1', name: 'Standard',  firstResponseMinutes: 240,  resolutionMinutes: 1440, businessHoursOnly: true  },
  { id: 'p2', name: 'Priority',  firstResponseMinutes: 60,   resolutionMinutes: 480,  businessHoursOnly: false },
  { id: 'p3', name: 'VIP',       firstResponseMinutes: 30,   resolutionMinutes: 240,  businessHoursOnly: false },
  { id: 'p4', name: 'Low Touch', firstResponseMinutes: 1440, resolutionMinutes: 4320, businessHoursOnly: true  },
]

export const mockDomains: Domain[] = [
  { id: 'd1', name: 'ezshuttle.co.za',   slaPolicyId: 'p3', priority: 1 },
  { id: 'd2', name: 'support@acme.com',  slaPolicyId: 'p2', priority: 2 },
  { id: 'd3', name: 'help@contoso.com',  slaPolicyId: 'p1', priority: 3 },
  { id: 'd4', name: 'info@northwind.io', slaPolicyId: 'p4', priority: 4 },
]

const now = new Date()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString()
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600_000).toISOString()

export const mockTickets: Ticket[] = [
  {
    id: 'TKT-1001',
    subject: 'Unable to complete booking — payment gateway error',
    customerEmail: 'john.smith@gmail.com',
    domain: 'ezshuttle.co.za',
    domainId: 'd1',
    status: 'open',
    slaStatus: 'breached',
    slaPolicy: 'VIP',
    assignedAgent: 'Cara Williams',
    assignedAgentId: 'u3',
    firstResponseDue: hoursAgo(2),
    resolutionDue: hoursAgo(0.5),
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(1),
    tags: ['payment', 'urgent'],
    messages: [
      { id: 'm1', ticketId: 'TKT-1001', direction: 'inbound',  from: 'john.smith@gmail.com', body: 'Hi, I\'ve been trying to book a shuttle for tomorrow morning but every time I get to the payment step it shows an error and my card gets charged but no booking is confirmed. This has happened twice. Please help urgently.', createdAt: hoursAgo(8) },
      { id: 'm2', ticketId: 'TKT-1001', direction: 'outbound', from: 'Cara Williams', body: 'Hi John, thank you for contacting us. I can see the charges on our end — I\'m escalating this to our payments team right now and will update you within the hour. I\'m sorry for the inconvenience.', createdAt: hoursAgo(7) },
      { id: 'm3', ticketId: 'TKT-1001', direction: 'inbound',  from: 'john.smith@gmail.com', body: 'It\'s been 2 hours and I still haven\'t heard back. I need to leave tomorrow at 6am. Please sort this out.', createdAt: hoursAgo(1) },
    ],
  },
  {
    id: 'TKT-1002',
    subject: 'Driver did not arrive — need refund',
    customerEmail: 'sarah.jones@acme.com',
    domain: 'support@acme.com',
    domainId: 'd2',
    status: 'open',
    slaStatus: 'at_risk',
    slaPolicy: 'Priority',
    assignedAgent: 'David Mokoena',
    assignedAgentId: 'u4',
    firstResponseDue: hoursFromNow(0.5),
    resolutionDue: hoursFromNow(3),
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(2),
    tags: ['refund', 'driver'],
    messages: [
      { id: 'm4', ticketId: 'TKT-1002', direction: 'inbound',  from: 'sarah.jones@acme.com', body: 'Our driver never showed up for the 9am airport transfer. We had to book an Uber and missed our flight. I need a full refund and an explanation.', createdAt: hoursAgo(5) },
      { id: 'm5', ticketId: 'TKT-1002', direction: 'outbound', from: 'David Mokoena', body: 'Dear Sarah, I sincerely apologise for this experience. I\'m reviewing the dispatch logs now and will process a refund immediately. I\'ll have a full update for you within 2 hours.', createdAt: hoursAgo(4) },
    ],
  },
  {
    id: 'TKT-1003',
    subject: 'Request to update corporate account billing address',
    customerEmail: 'billing@contoso.com',
    domain: 'help@contoso.com',
    domainId: 'd3',
    status: 'pending',
    slaStatus: 'on_track',
    slaPolicy: 'Standard',
    assignedAgent: 'Cara Williams',
    assignedAgentId: 'u3',
    firstResponseDue: hoursFromNow(2),
    resolutionDue: hoursFromNow(18),
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(1),
    tags: ['billing', 'account'],
    messages: [
      { id: 'm6', ticketId: 'TKT-1003', direction: 'inbound',  from: 'billing@contoso.com', body: 'Please update our billing address to: 123 New Street, Sandton, 2196. Also update the VAT number to 4560123456.', createdAt: hoursAgo(3) },
      { id: 'm7', ticketId: 'TKT-1003', direction: 'outbound', from: 'Cara Williams', body: 'Hi, I\'ve submitted the update request to our accounts team. Could you please confirm the company registration number so we can verify the VAT update?', createdAt: hoursAgo(2) },
    ],
  },
  {
    id: 'TKT-1004',
    subject: 'App crash when selecting return trip',
    customerEmail: 'mike.p@northwind.io',
    domain: 'info@northwind.io',
    domainId: 'd4',
    status: 'open',
    slaStatus: 'on_track',
    slaPolicy: 'Low Touch',
    assignedAgent: null,
    assignedAgentId: null,
    firstResponseDue: hoursFromNow(12),
    resolutionDue: hoursFromNow(60),
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(2),
    tags: ['bug', 'app'],
    messages: [
      { id: 'm8', ticketId: 'TKT-1004', direction: 'inbound', from: 'mike.p@northwind.io', body: 'When I try to select a return trip on the mobile app (Android, version 3.2.1), it crashes immediately. This has been happening since yesterday\'s update.', createdAt: hoursAgo(2) },
    ],
  },
  {
    id: 'TKT-1005',
    subject: 'Invoice for March is incorrect — overcharged',
    customerEmail: 'finance@acme.com',
    domain: 'support@acme.com',
    domainId: 'd2',
    status: 'open',
    slaStatus: 'at_risk',
    slaPolicy: 'Priority',
    assignedAgent: 'Ben Pretorius',
    assignedAgentId: 'u2',
    firstResponseDue: hoursFromNow(0.2),
    resolutionDue: hoursFromNow(5),
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(3),
    tags: ['invoice', 'billing'],
    messages: [
      { id: 'm9', ticketId: 'TKT-1005', direction: 'inbound', from: 'finance@acme.com', body: 'Invoice #INV-2024-089 for March shows 47 trips but we only had 32 confirmed bookings. Please investigate and issue a corrected invoice.', createdAt: hoursAgo(4) },
    ],
  },
  {
    id: 'TKT-1006',
    subject: 'How do I add multiple stops to a booking?',
    customerEmail: 'tom.k@gmail.com',
    domain: 'ezshuttle.co.za',
    domainId: 'd1',
    status: 'resolved',
    slaStatus: 'on_track',
    slaPolicy: 'VIP',
    assignedAgent: 'David Mokoena',
    assignedAgentId: 'u4',
    firstResponseDue: hoursAgo(5),
    resolutionDue: hoursAgo(1),
    createdAt: hoursAgo(10),
    updatedAt: hoursAgo(1),
    tags: ['how-to'],
    messages: [
      { id: 'm10', ticketId: 'TKT-1006', direction: 'inbound',  from: 'tom.k@gmail.com', body: 'Is it possible to add a second stop when booking a shuttle? I can\'t find the option in the app.', createdAt: hoursAgo(10) },
      { id: 'm11', ticketId: 'TKT-1006', direction: 'outbound', from: 'David Mokoena', body: 'Hi Tom! Great question. To add multiple stops: 1) Start a new booking, 2) After entering your pickup, tap "Add Stop", 3) You can add up to 3 additional stops. Each stop adds to the journey time and price estimate. Let me know if you need help.', createdAt: hoursAgo(9) },
      { id: 'm12', ticketId: 'TKT-1006', direction: 'inbound',  from: 'tom.k@gmail.com', body: 'Perfect, found it! Thanks so much.', createdAt: hoursAgo(8) },
    ],
  },
]

export const mockNotificationSettings: NotificationSettings[] = mockSLAPolicies.map((p, i) => ({
  policyId: p.id,
  atRisk: {
    enabled: true,
    thresholds: [
      { id: `t${i}1`, percentage: 70, recipients: ['agent'], enabled: true  },
      { id: `t${i}2`, percentage: 90, recipients: ['agent', 'admin'], enabled: true  },
    ],
  },
  breach: {
    enabled: true,
    recipients: ['agent', 'admin'],
  },
  reminder: {
    enabled: i < 2,
    intervalMinutes: 30,
    maxCount: i === 0 ? null : 3,
    recipients: ['admin'],
  },
}))

export const mockKPI: KPIData = {
  totalOpen: mockTickets.filter(t => t.status === 'open' || t.status === 'waiting').length,
  atRisk: mockTickets.filter(t => t.slaStatus === 'at_risk').length,
  breached: mockTickets.filter(t => t.slaStatus === 'breached').length,
  avgResponseMinutes: 47,
}

// 30 days of daily data ending today (2026-05-07), each row has an ISO dateStr for filtering
const rawDailyData = [
  { isoDate: '2026-04-07', breaches: 1, atRisk: 3, avgMins: 61, resolved: 4, total: 9  },
  { isoDate: '2026-04-08', breaches: 3, atRisk: 5, avgMins: 74, resolved: 5, total: 11 },
  { isoDate: '2026-04-09', breaches: 0, atRisk: 2, avgMins: 38, resolved: 7, total: 10 },
  { isoDate: '2026-04-10', breaches: 2, atRisk: 4, avgMins: 55, resolved: 6, total: 12 },
  { isoDate: '2026-04-11', breaches: 1, atRisk: 2, avgMins: 42, resolved: 5, total: 8  },
  { isoDate: '2026-04-12', breaches: 0, atRisk: 1, avgMins: 29, resolved: 8, total: 9  },
  { isoDate: '2026-04-13', breaches: 0, atRisk: 1, avgMins: 25, resolved: 9, total: 10 },
  { isoDate: '2026-04-14', breaches: 4, atRisk: 6, avgMins: 82, resolved: 3, total: 14 },
  { isoDate: '2026-04-15', breaches: 2, atRisk: 5, avgMins: 67, resolved: 5, total: 13 },
  { isoDate: '2026-04-16', breaches: 1, atRisk: 3, avgMins: 48, resolved: 6, total: 11 },
  { isoDate: '2026-04-17', breaches: 3, atRisk: 4, avgMins: 71, resolved: 4, total: 12 },
  { isoDate: '2026-04-18', breaches: 0, atRisk: 2, avgMins: 33, resolved: 7, total: 10 },
  { isoDate: '2026-04-19', breaches: 0, atRisk: 1, avgMins: 27, resolved: 8, total: 9  },
  { isoDate: '2026-04-20', breaches: 0, atRisk: 1, avgMins: 22, resolved: 9, total: 10 },
  { isoDate: '2026-04-21', breaches: 2, atRisk: 4, avgMins: 58, resolved: 5, total: 11 },
  { isoDate: '2026-04-22', breaches: 5, atRisk: 8, avgMins: 91, resolved: 2, total: 15 },
  { isoDate: '2026-04-23', breaches: 3, atRisk: 6, avgMins: 76, resolved: 4, total: 13 },
  { isoDate: '2026-04-24', breaches: 1, atRisk: 3, avgMins: 44, resolved: 6, total: 11 },
  { isoDate: '2026-04-25', breaches: 0, atRisk: 2, avgMins: 31, resolved: 8, total: 10 },
  { isoDate: '2026-04-26', breaches: 0, atRisk: 1, avgMins: 26, resolved: 9, total: 10 },
  { isoDate: '2026-04-27', breaches: 0, atRisk: 1, avgMins: 23, resolved: 8, total: 9  },
  { isoDate: '2026-04-28', breaches: 1, atRisk: 3, avgMins: 47, resolved: 6, total: 10 },
  { isoDate: '2026-04-29', breaches: 2, atRisk: 5, avgMins: 52, resolved: 5, total: 11 },
  { isoDate: '2026-04-30', breaches: 4, atRisk: 7, avgMins: 68, resolved: 3, total: 13 },
  { isoDate: '2026-05-01', breaches: 1, atRisk: 3, avgMins: 41, resolved: 6, total: 10 },
  { isoDate: '2026-05-02', breaches: 3, atRisk: 6, avgMins: 37, resolved: 5, total: 12 },
  { isoDate: '2026-05-03', breaches: 0, atRisk: 2, avgMins: 29, resolved: 7, total: 9  },
  { isoDate: '2026-05-04', breaches: 2, atRisk: 4, avgMins: 45, resolved: 5, total: 11 },
  { isoDate: '2026-05-05', breaches: 5, atRisk: 8, avgMins: 78, resolved: 2, total: 14 },
  { isoDate: '2026-05-06', breaches: 3, atRisk: 5, avgMins: 55, resolved: 4, total: 12 },
  { isoDate: '2026-05-07', breaches: 1, atRisk: 4, avgMins: 47, resolved: 5, total: 10 },
]

export interface DailyRow {
  isoDate: string
  label: string
  breaches: number
  atRisk: number
  avgMins: number
  resolved: number
  total: number
}

export const mockDailyData: DailyRow[] = rawDailyData.map((r) => ({
  ...r,
  label: new Date(r.isoDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
}))

export const mockDomainVolumeData = [
  { domain: 'ezshuttle.co.za',   tickets: 18 },
  { domain: 'support@acme.com',  tickets: 12 },
  { domain: 'help@contoso.com',  tickets: 8  },
  { domain: 'info@northwind.io', tickets: 5  },
]
