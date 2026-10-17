import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { cx, Icon, type IconName } from '@/ui'

const ITEMS: { to: string; key: string; icon: IconName }[] = [
  { to: '/', key: 'home', icon: 'home' },
  { to: '/kamai', key: 'kamai', icon: 'wallet' },
  { to: '/haq', key: 'haq', icon: 'scale' },
  { to: '/kagaz', key: 'kagaz', icon: 'file' },
  { to: '/suraksha', key: 'suraksha', icon: 'shield' },
]

export function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('nav.label')}
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cx(
                  'flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold',
                  isActive ? 'text-brand' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cx('rounded-full px-3 py-0.5', isActive && 'bg-brand-soft')}>
                    <Icon name={item.icon} />
                  </span>
                  {t(`nav.${item.key}`)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
