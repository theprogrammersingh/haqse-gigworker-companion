import { useTranslation } from 'react-i18next'
import { EmptyState, LinkButton } from '@/ui'

export function NotFound() {
  const { t } = useTranslation()
  return (
    <EmptyState icon="info" title={t('error.notFound')}>
      <LinkButton to="/" icon="home">
        {t('nav.home')}
      </LinkButton>
    </EmptyState>
  )
}
