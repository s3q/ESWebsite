import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ScrollReveals } from '@/components/motion/ScrollReveals'
import { EventsTimeline } from '@/components/pages/events/EventsTimeline'
import { FeaturedEvent } from '@/components/pages/events/FeaturedEvent'
import styles from '@/components/pages/events/Events.module.css'
import { PlatformHero, SampleNotice } from '@/components/platform/Platform'
import { omanDateKey } from '@/lib/core-api/adapter'
import { listPublicEvents } from '@/lib/core-api/events.server'
import { getI18n } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.platform.eventsPage.metaTitle, description: t.platform.eventsPage.metaDescription }
}

/** Every public event, from the Core API. When Core can't be reached the page says so and stays usable. */
export default async function EventsPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { t, locale } = await getI18n()
  const c = t.platform.eventsPage
  const [{ state }, result] = await Promise.all([searchParams, listPublicEvents(locale)])
  const events = result.status === 'ok' ? result.events : []
  const upcoming = events.filter((e) => e.phase === 'upcoming')
  const featured = upcoming[0]
  const month = omanDateKey(result.now).slice(0, 7)
  const thisMonth = upcoming.filter((e) => omanDateKey(e.startsAt).slice(0, 7) === month).length
  const open = upcoming.filter((e) => e.offersRegistration).length

  return (
    <>
      <PlatformHero
        eyebrow={c.eyebrow}
        title={c.title}
        lead={<p>{c.lead}</p>}
        tone="surface"
        visual={featured ? <FeaturedEvent event={featured} /> : undefined}
      >
        {result.status === 'ok' && (
          <dl className={styles.heroStats}>
            <div>
              <dt>{c.stats.upcoming}</dt>
              <dd>{upcoming.length}</dd>
            </div>
            <div>
              <dt>{c.stats.thisMonth}</dt>
              <dd>{thisMonth}</dd>
            </div>
            <div>
              <dt>{c.stats.open}</dt>
              <dd>{open}</dd>
            </div>
          </dl>
        )}
        {result.status === 'ok' && result.sample && <SampleNotice strong={c.fixtureNotice.strong} body={c.fixtureNotice.body} />}
      </PlatformHero>
      <Suspense fallback={null}>
        <EventsTimeline events={events} now={result.now} unavailable={result.status === 'unavailable'} state={state} />
      </Suspense>
      <ScrollReveals />
    </>
  )
}
