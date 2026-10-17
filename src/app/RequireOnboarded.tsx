import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useSettings } from '@/hooks'
import { writeOnboardedHint } from '@/lib/db/hints'

/** Sends first-time users to onboarding; renders nothing while settings load (one IndexedDB read). */
export function RequireOnboarded() {
  const settings = useSettings()
  const onboarded = settings?.onboarded
  // Keeps the startup hint in sync (e.g. a device that onboarded before hints existed).
  useEffect(() => {
    if (onboarded !== undefined) writeOnboardedHint(onboarded)
  }, [onboarded])
  if (!settings) return null
  return settings.onboarded ? <Outlet /> : <Navigate to="/welcome" replace />
}
