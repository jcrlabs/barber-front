import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Appointment, Barber, DayOverride, DaySummary, Meta, Notifications, Page, Provider, Service, Slot, Stats, User } from './types'

export const qk = {
  meta: ['meta'] as const,
  services: ['services'] as const,
  barbers: ['barbers'] as const,
  providers: ['providers'] as const,
  days: (s: string, b: string | null) => ['days', s, b] as const,
  slots: (s: string, b: string | null, d: string) => ['slots', s, b, d] as const,
  mine: ['appointments', 'mine'] as const,
  agenda: (from: string, to: string, b?: string) => ['agenda', from, to, b] as const,
  admin: (k: string, p?: unknown) => ['admin', k, p] as const,
}

const qs = (o: Record<string, string | number | null | undefined>) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== '') as [string, string][]).toString()

export const useMeta = () =>
  useQuery({
    queryKey: qk.meta,
    queryFn: () => api<Meta>('/meta'),
    staleTime: Infinity,
  })
export const useServices = () =>
  useQuery({
    queryKey: qk.services,
    queryFn: () => api<Service[]>('/services'),
  })
export const useBarbers = () => useQuery({ queryKey: qk.barbers, queryFn: () => api<Barber[]>('/barbers') })
export const useProviders = () =>
  useQuery({
    queryKey: qk.providers,
    queryFn: () => api<{ providers: Provider[] }>('/auth/providers'),
    staleTime: Infinity,
  })

export const useDays = (serviceId: string | null, barberId: string | null) =>
  useQuery({
    queryKey: qk.days(serviceId ?? '', barberId),
    queryFn: () => api<DaySummary[]>(`/availability/days?${qs({ service_id: serviceId, barber_id: barberId, days: 21 })}`),
    enabled: !!serviceId,
  })

export const useSlots = (serviceId: string | null, barberId: string | null, date: string | null) =>
  useQuery({
    queryKey: qk.slots(serviceId ?? '', barberId, date ?? ''),
    queryFn: () => api<{ slots: Slot[] }>(`/availability?${qs({ service_id: serviceId, barber_id: barberId, date })}`).then((r) => r.slots),
    enabled: !!serviceId && !!date,
    refetchInterval: 60_000,
  })

export const useMyAppointments = () =>
  useQuery({
    queryKey: qk.mine,
    queryFn: () => api<Appointment[]>('/appointments/mine'),
  })

export function useBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { service_id: string; barber_id: string; starts_at: string; notes: string; phone: string }) =>
      api<Appointment>('/appointments', { method: 'POST', json: body }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['slots'] })
      qc.invalidateQueries({ queryKey: ['days'] })
      qc.invalidateQueries({ queryKey: qk.mine })
    },
  })
}

export function useCancel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<Appointment>(`/appointments/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.mine }),
  })
}

export const useAgenda = (from: string, to: string, barberId?: string) =>
  useQuery({
    queryKey: qk.agenda(from, to, barberId),
    queryFn: () => api<Appointment[]>(`/staff/agenda?${qs({ from, to, barber_id: barberId })}`),
    refetchInterval: 60_000,
  })

export function useSetStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api<Appointment>(`/staff/appointments/${id}/status`, {
        method: 'POST',
        json: { status },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agenda'] })
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export const useStats = () =>
  useQuery({
    queryKey: qk.admin('stats'),
    queryFn: () => api<Stats>('/admin/stats'),
  })
export const useAdminServices = () =>
  useQuery({
    queryKey: qk.admin('services'),
    queryFn: () => api<Service[]>('/admin/services'),
  })
export const useAdminBarbers = (enabled = true) =>
  useQuery({
    queryKey: qk.admin('barbers'),
    queryFn: () => api<Barber[]>('/admin/barbers'),
    enabled,
  })

export const useAdminAppointments = (p: { status?: string; from?: string; to?: string; barber_id?: string; offset: number }) =>
  useQuery({
    queryKey: qk.admin('appointments', p),
    queryFn: () => api<Page<Appointment>>(`/admin/appointments?${qs({ ...p, limit: 25 })}`),
    placeholderData: (prev) => prev,
  })

export const useAdminUsers = (p: { q: string; role: string; offset: number }) =>
  useQuery({
    queryKey: qk.admin('users', p),
    queryFn: () => api<Page<User>>(`/admin/users?${qs({ ...p, limit: 25 })}`),
    placeholderData: (prev) => prev,
  })

export const useOverrides = () =>
  useQuery({
    queryKey: qk.admin('overrides'),
    queryFn: () => api<DayOverride[]>('/admin/overrides'),
  })

/** Reservas creadas desde `since`; el panel lo consulta cada 30 s para avisar al admin. */
export const useNotifications = (since: string, enabled: boolean) =>
  useQuery({
    queryKey: qk.admin('notifications', since),
    queryFn: () => api<Notifications>(`/admin/notifications?${qs({ since })}`),
    enabled,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  })

/** Mutación genérica de admin que refresca catálogo público y panel. */
export function useAdminMutation<T>(fn: (v: T) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] })
      qc.invalidateQueries({ queryKey: qk.services })
      qc.invalidateQueries({ queryKey: qk.barbers })
      qc.invalidateQueries({ queryKey: ['days'] })
      qc.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}
