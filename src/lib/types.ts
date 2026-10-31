export type Role = 'client' | 'admin'
export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export interface User {
  id: string
  email: string
  name: string
  phone: string
  avatar_url: string
  role: Role
  email_verified: boolean
  has_password: boolean
  providers: string[]
  created_at: string
}

export interface Session {
  access_token: string
  expires_at: string
  user: User
}

export interface Service {
  id: string
  name: string
  description: string
  duration_min: number
  price_cents: number
  active: boolean
  sort_order: number
}

export interface WorkingHours {
  weekday: number
  start_min: number
  end_min: number
}

export interface Barber {
  id: string
  user_id?: string | null
  name: string
  title: string
  bio: string
  avatar_url: string
  active?: boolean
  hours: WorkingHours[]
}

export interface Slot {
  starts_at: string
  ends_at: string
  barber_ids: string[]
}

export interface DaySummary {
  date: string
  free: number
  open: boolean
}

export interface Appointment {
  id: string
  client_id: string
  barber_id: string
  service_id: string
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  price_cents: number
  notes: string
  created_at: string
  client_name: string
  client_email?: string
  client_phone?: string
  barber_name: string
  service_name: string
}

export type OverrideKind = 'closed' | 'open' | 'block'

export interface DayOverride {
  id: string
  barber_id: string | null
  day: string
  kind: OverrideKind
  start_min: number | null
  end_min: number | null
  note: string
}

export interface Notifications {
  items: Appointment[]
  server_time: string
  channels: string[]
}

export interface Meta {
  timezone: string
  slot_step_min: number
  lead_time_min: number
  booking_window_day: number
  cancel_window_min: number
  max_active: number
}

export interface Stats {
  today_count: number
  upcoming_count: number
  week_revenue_cents: number
  month_revenue_cents: number
  clients_count: number
  no_show_rate_pct: number
  top_service: string
}

export interface Page<T> {
  items: T[]
  total: number
}

export interface Provider {
  name: string
  label: string
}
