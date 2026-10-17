import { createBrowserRouter } from 'react-router'
import { AppLayout } from './AppLayout'
import { RouteError } from './ErrorBoundary'
import { RequireOnboarded } from './RequireOnboarded'
import { HydrateFallback } from './HydrateFallback'

/**
 * Every screen is a lazy chunk; only the shell ships in the initial bundle.
 * Created on demand (not at import) so startup can pick the first URL beforehand.
 */
export const createAppRouter = (): ReturnType<typeof createBrowserRouter> =>
  createBrowserRouter(
    [
      {
        path: '/welcome',
        ErrorBoundary: RouteError,
        HydrateFallback,
        lazy: () => import('@/features/onboarding').then((m) => ({ Component: m.OnboardingPage })),
      },
      {
        Component: RequireOnboarded,
        ErrorBoundary: RouteError,
        HydrateFallback,
        children: [
          {
            Component: AppLayout,
            children: [
              {
                ErrorBoundary: RouteError,
                children: [
                  {
                    index: true,
                    lazy: () => import('@/features/home').then((m) => ({ Component: m.HomePage })),
                  },
                  {
                    path: 'kamai',
                    lazy: () =>
                      import('@/features/kamai').then((m) => ({ Component: m.KamaiPage })),
                  },
                  {
                    path: 'haq',
                    lazy: () => import('@/features/haq').then((m) => ({ Component: m.HaqPage })),
                  },
                  {
                    path: 'haq/:schemeId',
                    lazy: () => import('@/features/haq').then((m) => ({ Component: m.SchemePage })),
                  },
                  {
                    path: 'kagaz',
                    lazy: () =>
                      import('@/features/kagaz').then((m) => ({ Component: m.KagazPage })),
                  },
                  {
                    path: 'shikayat',
                    lazy: () =>
                      import('@/features/shikayat').then((m) => ({ Component: m.ShikayatPage })),
                  },
                  {
                    path: 'shikayat/new',
                    lazy: () =>
                      import('@/features/shikayat').then((m) => ({
                        Component: m.NewGrievancePage,
                      })),
                  },
                  {
                    path: 'shikayat/:id',
                    lazy: () =>
                      import('@/features/shikayat').then((m) => ({ Component: m.GrievancePage })),
                  },
                  {
                    path: 'suraksha',
                    lazy: () =>
                      import('@/features/suraksha').then((m) => ({ Component: m.SurakshaPage })),
                  },
                  {
                    path: 'settings',
                    lazy: () =>
                      import('@/features/settings').then((m) => ({ Component: m.SettingsPage })),
                  },
                  {
                    path: '*',
                    lazy: () => import('./NotFound').then((m) => ({ Component: m.NotFound })),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
  )
