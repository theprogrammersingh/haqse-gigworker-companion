import { Navigate, Outlet } from 'react-router'
import { useSettings } from '@/hooks'

/** Sends first-time users to onboarding; renders nothing while settings load (one IndexedDB read). */
export function RequireOnboarded() {
  const settings = useSettings()
  if (!settings) return null
  return settings.onboarded ? <Outlet /> : <Navigate to="/welcome" replace />
}
