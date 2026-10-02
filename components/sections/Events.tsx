import { EVENTS, EVENT_TIMEZONE_LABEL, REGISTRATION_LABEL, type SocietyEvent } from '@/content/events'
import { eventDateParts, eventTimeRange } from '@/lib/format'
import { IconClock, IconPin } from '@/components/ui/icons'
import { ItemMedia } from '@/components/ui/Plate'
import { PreviewAction } from '@/components/ui/PreviewAction'
import styles from './Events.module.css'

export function Events() {
  const [featured, ...rest] = EVENTS

  return (
    <section id="events" className={`section ${styles.section}`} aria-labelledby="events-title">
      <div className="container">
        <header className="section-head">
          <h2 id="events-title" className="section-title" data-reveal="heading">
            Find your next experience.
          </h2>
          <div className={styles.headAside} data-reveal="rise">
            <p className="section-lead">
              <p style={{display: "none"}}>
              Workshops, talks and visits run by the society’s committees, with registration on the same page.
            </p>
            </p>
            <p className="preview-note">
              <span className="status-dot" aria-hidden="true" />
              <span>
                <strong>Sample listings.</strong> No events have been published on the platform yet; these show how
                they will appear.
              </span>
            </p>
          </div>
        </header>

        {featured ? (
          <>
            <FeaturedEvent event={featured} />
            {rest.length > 0 && (
              <div className={styles.schedule}>
                <h3 className={styles.scheduleTitle}>Also coming up</h3>
                <ol className={styles.list} data-reveal="rows">
                  {rest.map((event) => (
                    <li key={event.id} className={styles.item}>
                      <span className={styles.rule} data-part="rule" aria-hidden="true" />
                      <EventRow event={event} />
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        ) : (
          <p className={styles.empty}>
            No events are scheduled right now. New workshops and talks will appear here as committees publish them.
          </p>
        )}
      </div>
    </section>
  )
}

function Meta({ event, className }: { event: SocietyEvent; className?: string }) {
  const date = eventDateParts(event.start)
  return (
    <dl className={[styles.meta, className].filter(Boolean).join(' ')}>
      <div>
        <dt>
          <IconClock className={styles.metaIcon} />
          <span className="visually-hidden">Date and time</span>
        </dt>
        <dd>
          <time dateTime={event.start}>{date.long}</time>, {eventTimeRange(event.start, event.end)}{' '}
          <span className={styles.tz}>{EVENT_TIMEZONE_LABEL}</span>
        </dd>
      </div>
      <div>
        <dt>
          <IconPin className={styles.metaIcon} />
          <span className="visually-hidden">Location</span>
        </dt>
        <dd>{event.location}</dd>
      </div>
    </dl>
  )
}

function Register({ event, variant }: { event: SocietyEvent; variant: 'primary' | 'secondary' }) {
  return (
    <div className={styles.register}>
      <p className={styles.status}>
        <span className="status-dot" aria-hidden="true" />
        {REGISTRATION_LABEL[event.registration]}
      </p>
      <PreviewAction
        label="Preview registration"
        labelSuffix={event.title}
        variant={variant}
        compact
        arrow
        title="Registration isn’t open yet"
      >
        <p>
          <strong>{event.title}</strong> is a sample listing. When event registration launches in Phase 1, you’ll
          register right here and see your confirmation instantly on the same page.
        </p>
        <p>Nothing has been submitted, and no place has been reserved.</p>
      </PreviewAction>
    </div>
  )
}

function FeaturedEvent({ event }: { event: SocietyEvent }) {
  const date = eventDateParts(event.start)
  return (
    <article className={styles.featured} aria-labelledby={`${event.id}-title`} data-reveal="feature">
      <div className={styles.visual}>
        <div className={styles.media} data-part="media">
          <ItemMedia
            id={event.id}
            drawing={event.drawing}
            image={event.image}
            tone="soft"
            sizes="(min-width: 64rem) 58vw, 100vw"
            className={styles.plate}
          />
          {event.sample && <span className={`chip chip--sample ${styles.sampleTag}`}>Sample</span>}
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
          Featured · {event.type}
        </p>
        <h3 id={`${event.id}-title`} className={styles.featuredTitle} data-part="text">
          {event.title}
        </h3>
        <p className={styles.description} data-part="text">
          {event.description}
        </p>
        <div data-part="text">
          <Meta event={event} />
        </div>
        <div data-part="text">
          <Register event={event} variant="primary" />
        </div>
      </div>
    </article>
  )
}

function EventRow({ event }: { event: SocietyEvent }) {
  const date = eventDateParts(event.start)
  return (
    <article className={styles.row} aria-labelledby={`${event.id}-title`} data-part="row">
      <p className={styles.rowDate} aria-hidden="true">
        <span className={styles.rowDay}>{date.day}</span>
        <span className={styles.rowMonth}>{date.month}</span>
      </p>
      <div className={styles.rowMain}>
        <p className={styles.type}>
          {event.type}
          {event.sample && <span className="chip chip--sample">Sample</span>}
        </p>
        <h3 id={`${event.id}-title`} className={styles.rowTitle}>
          {event.title}
        </h3>
        <p className={styles.description}>{event.description}</p>
      </div>
      <Meta event={event} className={styles.rowMeta} />
      <div className={styles.rowAction}>
        <Register event={event} variant="secondary" />
      </div>
    </article>
  )
}
