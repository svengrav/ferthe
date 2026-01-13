import { PageLayout } from '@/components/PageLayout.tsx'
import privacyDe from '@/content/de/privacy.md'
import privacyEn from '@/content/en/privacy.md'

export function Privacy() {
  return (
    <PageLayout
      title="Privacy Policy / Datenschutzerklärung"
      germanContent={privacyDe}
      englishContent={privacyEn}
      backButtonText="← Back to Home"
      backButtonPath="/"
    />
  )
}
