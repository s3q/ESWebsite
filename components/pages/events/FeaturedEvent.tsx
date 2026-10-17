'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { StatusBadge } from '@/components/platform/Platform'
import { IconArrowRight } from '@/components/ui/icons'
import { Plate } from '@/components/ui/Plate'
import type { EventView } from '@/lib/core-api/types'
import { eventDateParts, timeIsolated } from '@/lib/format'
import { BADGE_TONE, badgeFor } from './availability'
import styles from './Events.module.css'

/** The hero's featured event (the soonest upcoming one): a sheet with the date stamped across the corner. */
export function FeaturedEvent({ event }: { event: EventView }) {
  const { t, intl } = useI18n()
  const c = t.platform.eventsPage
  const d = eventDateParts(event.startsAt, intl)
  const badge = badgeFor(event)
  const meta = [d.weekday, event.hasTime ? timeIsolated(event.startsAt, intl) : null, event.location || null].filter(Boolean).join(' · ')
  return (
    <Link href={event.href} className={`${styles.featured} intro-item`} style={{ '--i': 2 } as CSSProperties}>
      <Plate id={`featured-${event.id}`} drawing="calendar" tone="ivory" className={styles.featuredMedia} />
      <span className={styles.featuredStamp}>
        <span className={styles.stampDay}>{d.day}</span>
        <span className={styles.stampMonth}>{d.month}</span>
      </span>
      <span className={styles.featuredBody}>
        <span className={styles.cardTop}>
          <span className="chip chip--brand">{c.featured}</span>
          <StatusBadge tone={BADGE_TONE[badge]}>{c.availability[badge]}</StatusBadge>
        </span>
        <span className={styles.featuredTitle}>{event.title}</span>
        <span className={styles.cardMeta}>{meta}</span>
        <span className={styles.featuredFoot}>
          {event.committeeName ? <span className={styles.footText}>{event.committeeName}</span> : <span />}
          <span className={styles.featuredCta}>
            {c.view}
            <IconArrowRight className="btn__arrow" />
          </span>
        </span>
      </span>
    </Link>
  )
}
