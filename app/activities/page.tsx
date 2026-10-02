import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { ScrollReveals } from '@/components/motion/ScrollReveals'
import { ArchiveBrowser } from '@/components/sections/ArchiveBrowser'
import { ArchiveEmpty } from '@/components/sections/ArchiveEmpty'
import { PageIntro } from '@/components/sections/PageIntro'
import { ACTIVITIES, ACTIVITY_EDITIONS } from '@/content/activities'
import { getI18n } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.meta.archiveTitle, description: t.meta.archiveDescription }
}

export default async function ActivitiesArchivePage() {
  const { t } = await getI18n()
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <PageIntro eyebrow={t.archive.eyebrow} title={t.archive.title}>
          <p>{t.archive.lead}</p>
        </PageIntro>
        <section className="section" aria-label={t.archive.regionLabel} style={{ paddingTop: 0 }}>
          <div className="container">
            {ACTIVITY_EDITIONS.length === 0 ? (
              <ArchiveEmpty activities={ACTIVITIES} />
            ) : (
              <Suspense fallback={null}>
                <ArchiveBrowser editions={ACTIVITY_EDITIONS} activities={ACTIVITIES} />
              </Suspense>
            )}
          </div>
        </section>
      </main>
      <SiteFooter onHome={false} />
      <ScrollReveals />
    </>
  )
}
