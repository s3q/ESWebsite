import type { Metadata } from 'next'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { ScrollReveals } from '@/components/motion/ScrollReveals'
import { JoinInvitation } from '@/components/sections/JoinInvitation'
import { Overview } from '@/components/sections/Overview'
import { PageIntro } from '@/components/sections/PageIntro'
import { StatsStrip } from '@/components/sections/StatsStrip'
import { Structure } from '@/components/sections/Structure'
import { SOCIETY_FACTS } from '@/content/stats'
import { getI18n } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.meta.aboutTitle, description: t.meta.aboutDescription }
}

export default async function AboutPage() {
  const { t } = await getI18n()
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <PageIntro eyebrow={t.site.eyebrow} title={t.about.title}>
          <p>{t.about.lead}</p>
        </PageIntro>
        {/* The facts from the society's own overview; the homepage strip carries the live figures. */}
        <StatsStrip stats={SOCIETY_FACTS} kind="facts" />
        <Overview aboutLink={false} />
        <Structure />
        <JoinInvitation onHome={false} />
      </main>
      <SiteFooter onHome={false} />
      <ScrollReveals />
    </>
  )
}
