import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'
import { StateMessage } from '@/components/discovery/Discovery'
import { ScrollReveals } from '@/components/motion/ScrollReveals'
import { badgeFor } from '@/components/pages/events/availability'
import { RegistrationPanel } from '@/components/pages/events/RegistrationPanel'
import styles from '@/components/pages/events/Events.module.css'
import { Breadcrumbs } from '@/components/platform/Breadcrumbs'
import { SampleNotice } from '@/components/platform/Platform'
import { Plate } from '@/components/ui/Plate'
import { getPublicEvent, getRegistrationTransport, listPublicEvents } from '@/lib/core-api/events.server'
import { eventDateParts, timeIsolated } from '@/lib/format'
import { getI18n } from '@/lib/i18n/server'
import { routes } from '@/lib/routes'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const { t, locale } = await getI18n()
  const c = t.platform.eventsPage
  const result = await getPublicEvent(id, locale)
  if (result.status !== 'ok') return { title: c.metaTitle, robots: { index: false } }
  const summary = result.event.paragraphs[0]
  return { title: `${result.event.title} · ${c.eyebrow}`, description: summary && summary.length > 200 ? `${summary.slice(0, 197)}…` : summary }
}

/**
 * One event, from the Core API (GET /v1/events/{eventId}), with its registration panel.
 * Unknown ids are a 404; Core being unreachable is an honest "can't load right now".
 */
export default async function EventPage({ params }: Params) {
  const { id } = await params
  const { t, intl, locale } = await getI18n()
  const c = t.platform.eventsPage
  const [result, list] = await Promise.all([getPublicEvent(id, locale), listPublicEvents(locale)])
  if (result.status === 'not-found') notFound()

  if (result.status === 'unavailable') {
    return (
      <>
        <header className={styles.detailHero}>
          <div className="container">
            <Breadcrumbs trail={[{ href: routes.events, label: t.nav.links.events }]} current={c.detailUnavailableTitle} />
          </div>
        </header>
        <div className={`container ${styles.detailState}`}>
          <StateMessage
            kind="error"
            title={c.detailUnavailableTitle}
            body={c.detailUnavailableBody}
            action={
              <>
                <a href={routes.event(encodeURIComponent(id))} className="btn btn--secondary">
                  {t.platform.states.retry}
                </a>
                <Link href={routes.events} className="btn btn--secondary">
                  {c.allEvents}
                </Link>
              </>
            }
          />
        </div>
      </>
    )
  }

  const { event } = result
  const d = eventDateParts(event.startsAt, intl)
  const transport = getRegistrationTransport()
  const more = list.status === 'ok' ? list.events.filter((e) => e.phase === 'upcoming' && e.id !== event.id).slice(0, 3) : []

  return (
    <>
      <header className={styles.detailHero}>
        <div className="container">
          <Breadcrumbs trail={[{ href: routes.events, label: t.nav.links.events }]} current={event.title} />
          <div className={styles.detailGrid}>
            <div>
              {event.committeeName && <span className="chip">{event.committeeName}</span>}
              <h1 className={`${styles.detailTitle} intro-item`}>{event.title}</h1>
              <dl className={`${styles.facts} intro-item`} style={{ '--i': 1 } as CSSProperties}>
                <div>
                  <dt>{c.date}</dt>
                  <dd>
                    <time dateTime={event.startsAt}>{d.long}</time>
                  </dd>
                </div>
                <div>
                  <dt>{c.time}</dt>
                  <dd>
                    {event.hasTime ? (
                      <>
                        {timeIsolated(event.startsAt, intl)}
                        <br />
                        <span className={styles.factNote}>{c.timezone}</span>
                      </>
                    ) : (
                      t.common.toBeAnnounced
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{c.location}</dt>
                  <dd>{event.location || t.common.toBeAnnounced}</dd>
                </div>
              </dl>
            </div>
            <Plate id={`detail-${event.id}`} drawing="calendar" tone="ivory" className={styles.detailMedia} />
          </div>
        </div>
      </header>

      <div className={`container ${styles.detailBody}`}>
        <div className={styles.main}>
          <section aria-labelledby="about-event">
            <h2 id="about-event" className={styles.blockTitle}>
              {c.about}
            </h2>
            <div className={styles.prose} data-reveal="stagger">
              {event.paragraphs.length > 0 ? event.paragraphs.map((p, i) => <p key={i}>{p}</p>) : <p className={styles.panelNote}>{c.aboutEmpty}</p>}
            </div>
          </section>

          {event.committeeName && (
            <section aria-labelledby="event-details">
              <h2 id="event-details" className={styles.blockTitle}>
                {c.details}
              </h2>
              <dl className={styles.meta}>
                <div>
                  <dt>{c.organiser}</dt>
                  <dd>{event.committeeName}</dd>
                </div>
              </dl>
            </section>
          )}
          {result.sample && <SampleNotice strong={c.fixtureNotice.strong} body={c.fixtureNotice.body} />}
        </div>

        <aside id="register" className={styles.aside} aria-label={c.registration}>
          <RegistrationPanel
            event={{ id: event.id, title: event.title, availability: event.availability, phase: event.phase, offersRegistration: event.offersRegistration }}
            transport={transport}
          />
        </aside>
      </div>

      {more.length > 0 && (
        <section className={styles.related} aria-labelledby="related-title">
          <div className="container">
            <h2 id="related-title" className="section-title" data-reveal="heading" style={{ marginBottom: 'var(--space-7)' }}>
              {c.moreUpcoming}
            </h2>
            <ul className={styles.relatedList} data-reveal="stagger">
              {more.map((r) => {
                const rd = eventDateParts(r.startsAt, intl)
                return (
                  <li key={r.id}>
                    <Link href={r.href} className={styles.mini}>
                      <span className={styles.miniDate}>
                        {rd.day} {rd.month} {rd.year}
                      </span>
                      <span className={styles.cardTitle}>{r.title}</span>
                      <span className={styles.cardMeta}>{c.availability[badgeFor(r)]}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}
      <ScrollReveals />
    </>
  )
}
