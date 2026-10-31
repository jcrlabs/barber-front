import type { User } from './types'

/** Barberos y admins entran en la agenda y en su panel. */
export const isStaff = (u: User | null | undefined) => u?.role === 'barber' || u?.role === 'admin'
export const isAdmin = (u: User | null | undefined) => u?.role === 'admin'
