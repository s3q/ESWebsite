import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { ScrollReveals } from '@/components/motion/ScrollReveals'
import { ArchiveBrowser } from '@/components/sections/ArchiveBrowser'
import { ArchiveEmpty } from '@/components/sections/ArchiveEmpty'
import { PageIntro } from '@/components/sections/PageIntro'
import { ACTIVITIES, ACTIVITY_EDITIONS } from '@/content/activities'
import { SITE } from '@/content/site'

export const metadata: Metadata = {
  title: `Previous Activities — ${SITE.name}`,
  description: 'Past editions of the Engineering Society’s programmes at Sultan Qaboos University.',
}

export default function ActivitiesArchivePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <PageIntro eyebrow="Engineering Society Activities" title="Previous Activities">
          <p>A record of past editions of the society’s programmes, by programme and year.</p>
        </PageIntro>
        <section className="section" aria-label="Archive of previous activities" style={{ paddingTop: 0 }}>
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
