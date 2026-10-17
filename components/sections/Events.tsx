import Link from 'next/link'
import { Suspense } from 'react'
import { IconArrowRight, IconClock, IconPin } from '@/components/ui/icons'
import { Plate } from '@/components/ui/Plate'
import { listPublicEvents, servesFixtures } from '@/lib/core-api/events.server'
import type { EventView } from '@/lib/core-api/types'
import { eventDateParts, eventTime } from '@/lib/format'
import type { I18n } from '@/lib/i18n'
import { getI18n } from '@/lib/i18n/server'
import { routes } from '@/lib/routes'
import styles from './Events.module.css'

/** Upcoming events listed under the featured one; the full timeline lives at /events. */
const MORE = 3

/**
 * The homepage's upcoming events, from the Core API. The heading renders at once; the list
 * streams in when Core answers (Suspense), so a slow or unreachable Core never holds up the
 * rest of the page. Empty and unavailable are told apart, and no event is ever invented.
 */
export async function Events() {
  const { t } = await getI18n()
  const sample = servesFixtures()

  return (
    <section id="events" className={`section ${styles.section}`} aria-labelledby="events-title">
      <div className="container">
        <header className="section-head">
          <h2 id="events-title" className="section-title" data-reveal="heading">
            {t.events.title}
          </h2>
          {sample && (
            <div className={styles.headAside} data-reveal="rise">
              <p className="preview-note">
                <span className="status-dot" aria-hidden="true" />
                <span>
                  <strong>{t.events.sampleStrong}</strong> {t.events.sampleBody}
                </span>
              </p>
            </div>
          )}
        </header>
        <Suspense fallback={<p className={styles.empty} role="status" aria-busy="true">{t.events.loading}</p>}>
          <UpcomingEvents />
        </Suspense>
      </div>
    </section>
  )
}

async function UpcomingEvents() {
  const i18n = await getI18n()
  const { t, locale } = i18n
  const result = await listPublicEvents(locale)
  if (result.status === 'unavailable') {
    return (
      <p className={styles.empty} role="status">
        {t.events.unavailable}
      </p>
    )
  }
  const upcoming = result.events.filter((e) => e.phase === 'upcoming')
  const [featured, ...rest] = upcoming
  if (!featured) return <p className={styles.empty}>{t.events.empty}</p>
  const shown = rest.slice(0, MORE)

  return (
    <>
      <FeaturedEvent event={featured} i18n={i18n} sample={result.sample} />
      {shown.length > 0 && (
        <div className={styles.schedule}>
          <h3 className={styles.scheduleTitle}>{t.events.alsoComingUp}</h3>
          <ol className={styles.list} data-reveal="rows">
            {shown.map((event) => (
              <li key={event.id} className={styles.item}>
                <span className={styles.rule} data-part="rule" aria-hidden="true" />
                <EventRow event={event} i18n={i18n} sample={result.sample} />
              </li>
            ))}
          </ol>
        </div>
      )}
      {rest.length > shown.length && (
        <p className={styles.more}>
          <Link href={routes.events} className="btn btn--secondary btn--compact">
            {t.events.allEvents}
            <IconArrowRight className="btn__arrow" />
          </Link>
        </p>
      )}
    </>
  )
}

type Props = { event: EventView; i18n: I18n; sample?: boolean }

function Meta({ event, i18n, className }: Props & { className?: string }) {
  const { t, intl } = i18n
  const date = eventDateParts(event.startsAt, intl)
  return (
    <dl className={[styles.meta, className].filter(Boolean).join(' ')}>
      <div>
        <dt>
          <IconClock className={styles.metaIcon} />
          <span className="visually-hidden">{t.events.dateTime}</span>
        </dt>
        <dd>
          <time dateTime={event.startsAt}>{date.long}</time>
          {event.hasTime && (
            <>
              {t.common.comma}
              <span dir="ltr">{eventTime(event.startsAt, intl)}</span> <span className={styles.tz}>{t.events.timezone}</span>
            </>
          )}
        </dd>
      </div>
      {event.location && (
        <div>
          <dt>
            <IconPin className={styles.metaIcon} />
            <span className="visually-hidden">{t.events.location}</span>
          </dt>
          <dd>{event.location}</dd>
        </div>
      )}
    </dl>
  )
}

/** Availability as Core reports it, and the way to the event's page (where its registration is). */
function Register({ event, i18n, variant }: Props & { variant: 'primary' | 'secondary' }) {
  const { t } = i18n
  const c = t.platform.eventsPage
  const label = event.offersRegistration ? t.events.register : t.events.view
  return (
    <div className={styles.register}>
      <p className={styles.status}>
        <span className="status-dot" aria-hidden="true" />
        {c.availability[event.availability]}
      </p>
      <Link
        href={event.offersRegistration ? `${event.href}#register` : event.href}
        className={`btn btn--${variant} btn--compact`}
        aria-label={t.events.actionFor(label, event.title)}
      >
        {label}
        <IconArrowRight className="btn__arrow" />
      </Link>
    </div>
  )
}

/** The title opens the event's page; the text keeps the section's own styling. */
function EventTitle({ event, className, part }: Props & { className: string; part?: string }) {
  return (
    <h3 id={`event-${event.id}-title`} className={className} data-part={part}>
      <Link href={event.href} className={styles.titleLink}>
        {event.title}
      </Link>
    </h3>
  )
}

function FeaturedEvent({ event, i18n, sample }: Props) {
  const { t, intl } = i18n
  const date = eventDateParts(event.startsAt, intl)
  return (
    <article className={styles.featured} aria-labelledby={`event-${event.id}-title`} data-reveal="feature">
      <div className={styles.visual}>
        <div className={styles.media} data-part="media">
          <Plate id={`home-${event.id}`} drawing="calendar" tone="soft" className={styles.plate} />
          {sample && <span className={`chip chip--sample ${styles.sampleTag}`}>{t.common.sample}</span>}
        </div>
        {/* The date as a graphic element, straddling the drawing's edge. */}
        <p className={styles.date} data-part="date" aria-hidden="true">
          <span className={styles.day}>{date.day}</span>
          <span className={styles.dateMeta}>
            <span>
              {date.month} {date.year}
            </span>
            <span>{date.weekday}</span>
          </span>
        </p>
      </div>
      <div className={styles.featuredText}>
        <p className={styles.type} data-part="text">
          {event.committeeName ? `${t.events.featured} · ${event.committeeName}` : t.events.featured}
        </p>
        <EventTitle event={event} i18n={i18n} className={styles.featuredTitle} part="text" />
        {event.paragraphs[0] && (
          <p className={styles.description} data-part="text">
            {event.paragraphs[0]}
          </p>
        )}
        <div data-part="text">
          <Meta event={event} i18n={i18n} />
        </div>
        <div data-part="text">
          <Register event={event} i18n={i18n} variant="primary" />
        </div>
      </div>
    </article>
  )
}

function EventRow({ event, i18n, sample }: Props) {
  const { t, intl } = i18n
  const date = eventDateParts(event.startsAt, intl)
  return (
    <article className={styles.row} aria-labelledby={`event-${event.id}-title`} data-part="row">
      <p className={styles.rowDate} aria-hidden="true">
        <span className={styles.rowDay}>{date.day}</span>
        <span className={styles.rowMonth}>{date.month}</span>
      </p>
      <div className={styles.rowMain}>
        <p className={styles.type}>
          {event.committeeName}
          {sample && <span className="chip chip--sample">{t.common.sample}</span>}
        </p>
        <EventTitle event={event} i18n={i18n} className={styles.rowTitle} />
        {event.paragraphs[0] && <p className={styles.description}>{event.paragraphs[0]}</p>}
      </div>
      <Meta event={event} i18n={i18n} className={styles.rowMeta} />
      <div className={styles.rowAction}>
        <Register event={event} i18n={i18n} variant="secondary" />
      </div>
    </article>
  )
}
