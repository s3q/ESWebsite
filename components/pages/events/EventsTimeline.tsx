'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { ChipGroup, FilterSheet, ResultBar, SearchField, Skeleton, StateMessage, previewState } from '@/components/discovery/Discovery'
import { matchesQuery, useQueryState } from '@/components/discovery/useQueryState'
import { useI18n } from '@/components/i18n/I18nProvider'
import { StatusBadge } from '@/components/platform/Platform'
import { omanDateKey } from '@/lib/core-api/adapter'
import type { EventView } from '@/lib/core-api/types'
import { eventDateParts, timeIsolated } from '@/lib/format'
import { BADGE_TONE, badgeFor } from './availability'
import styles from './Events.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const KEYS = ['q', 'when'] as const
/** 'YYYY-MM' of the event's day in Oman. */
const monthKey = (iso: string) => omanDateKey(iso).slice(0, 7)

/** Past events shown before "Show earlier events" folds the rest away. */
const PAST_VISIBLE = 2

/**
 * The events timeline: one vertical line through the society's year. What has happened sits
 * above (the oldest folded away), a gold marker sets today on the line, and what comes next
 * runs below it, the nearest event marked. The line fills as the visitor reads down, a small
 * light riding its front, and each event's node lights as the line reaches it.
 *
 * Events arrive from the Core API (lib/core-api) already validated and adapted; `unavailable`
 * means Core couldn't be reached, which is told apart from an honest empty list.
 */
export function EventsTimeline({ events, now, unavailable = false, state }: { events: EventView[]; now: string; unavailable?: boolean; state?: string }) {
  const { t, intl } = useI18n()
  const c = t.platform.eventsPage
  const f = t.platform.filters
  const view = unavailable ? 'error' : previewState(state)
  const { values, lists, set, toggle, clear, activeCount } = useQueryState(KEYS)
  const root = useRef<HTMLDivElement>(null)
  const [showAllPast, setShowAllPast] = useState(false)

  const thisMonth = monthKey(now)
  const data = view === 'empty' ? [] : events
  const passes = (e: EventView, skip?: (typeof KEYS)[number]) => {
    const past = e.phase === 'past'
    return (
      (skip === 'q' || matchesQuery(values.q, e.title, e.description, e.location, e.committeeName)) &&
      (skip === 'when' ||
        lists.when.length === 0 ||
        (lists.when.includes('upcoming') && !past) ||
        (lists.when.includes('past') && past) ||
        (lists.when.includes('month') && monthKey(e.startsAt) === thisMonth))
    )
  }
  const shown = data.filter((e) => passes(e))
  const upcoming = shown.filter((e) => e.phase === 'upcoming')
  const past = shown.filter((e) => e.phase === 'past')
  // The oldest past events fold away unless the visitor is looking for them.
  const foldable = !showAllPast && !values.q && !lists.when.includes('past') && past.length > PAST_VISIBLE + 1
  const pastShown = foldable ? past.slice(-PAST_VISIBLE) : past
  const folded = past.length - pastShown.length
  const nextId = upcoming[0]?.id

  const whenOptions = (['upcoming', 'month', 'past'] as const).map((w) => ({ value: w, label: c.whenOptions[w] }))
  const active = [
    ...lists.when.map((v) => ({ key: `w${v}`, label: c.whenOptions[v as keyof typeof c.whenOptions] ?? v, onRemove: () => toggle('when', v) })),
    ...(values.q ? [{ key: 'q', label: `“${values.q}”`, onRemove: () => set({ q: null }) }] : []),
  ]

  // The line fills to the reading position (65% down the viewport) and nodes light as it
  // reaches them. Without motion the line is drawn and every node lit.
  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      const nodes = gsap.utils.toArray<HTMLElement>(el.querySelectorAll('[data-node]'))
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const line = ScrollTrigger.create({
          trigger: el,
          start: 'top 65%',
          end: 'bottom 65%',
          onUpdate: (self) => {
            el.style.setProperty('--progress', self.progress.toFixed(4))
            el.style.setProperty('--head', self.progress > 0.002 && self.progress < 0.998 ? '1' : '0')
          },
        })
        const lights = nodes.map((node) =>
          ScrollTrigger.create({
            trigger: node,
            start: 'top 65%',
            onToggle: (self) => {
              if (self.isActive || self.progress === 1) node.dataset.lit = ''
              else delete node.dataset.lit
            },
          }),
        )
        return () => {
          line.kill()
          lights.forEach((s) => s.kill())
          el.style.removeProperty('--progress')
          el.style.removeProperty('--head')
          nodes.forEach((n) => delete n.dataset.lit)
        }
      })
      mm.add('(prefers-reduced-motion: reduce)', () => {
        el.style.setProperty('--progress', '1')
        nodes.forEach((n) => (n.dataset.lit = ''))
      })
      return () => mm.revert()
    },
    { scope: root, dependencies: [shown.length, pastShown.length, values.q], revertOnUpdate: true },
  )

  const monthLabel = (key: string) => new Intl.DateTimeFormat(intl, { month: 'long', year: 'numeric', timeZone: 'Asia/Muscat' }).format(new Date(`${key}-15T12:00:00+04:00`))

  const filters = <ChipGroup label={c.when} options={whenOptions} selected={lists.when} onToggle={(v) => toggle('when', v)} allLabel={f.all} onAll={() => set({ when: null })} />

  const row = (e: EventView) => {
    const d = eventDateParts(e.startsAt, intl)
    const badge = badgeFor(e)
    const meta = [e.hasTime ? timeIsolated(e.startsAt, intl) : null, e.location || null].filter(Boolean).join(' · ')
    return (
      <li key={e.id} className={styles.row} data-past={e.phase === 'past' || undefined} data-next={e.id === nextId || undefined}>
        <span className={styles.node} data-node="" aria-hidden="true" />
        {e.id === nextId && <p className={styles.nextLabel}>{c.nextUp}</p>}
        <Link href={e.href} className={styles.card}>
          <span className={styles.stamp}>
            <span className={styles.stampDay}>{d.day}</span>
            <span className={styles.stampMonth}>{d.month}</span>
            <span className={styles.stampWeekday}>{d.weekday}</span>
          </span>
          <span className={styles.cardBody}>
            <span className={styles.cardTop}>
              {e.committeeName && <span className="chip">{e.committeeName}</span>}
              <StatusBadge tone={BADGE_TONE[badge]}>{c.availability[badge]}</StatusBadge>
            </span>
            <span className={styles.cardTitle}>{e.title}</span>
            {meta && <span className={styles.cardMeta}>{meta}</span>}
          </span>
        </Link>
      </li>
    )
  }

  const groups = (list: EventView[]) => {
    const out: { key: string; items: EventView[] }[] = []
    for (const e of list) {
      const k = monthKey(e.startsAt)
      const g = out.find((x) => x.key === k)
      if (g) g.items.push(e)
      else out.push({ key: k, items: [e] })
    }
    return out
  }

  return (
    <section className={styles.timelineSection} aria-label={c.timelineLabel}>
      <div className="container">
        {!unavailable && (
          <>
            <div className={styles.toolbar}>
              <SearchField value={values.q} onChange={(v) => set({ q: v || null })} placeholder={c.searchPlaceholder} label={c.searchLabel} />
              <FilterSheet active={activeCount} shown={shown.length}>
                {filters}
              </FilterSheet>
              <div className={styles.inlineFilters}>{filters}</div>
            </div>
            <ResultBar shown={shown.length} total={data.length} active={active} onClearAll={() => clear()} />
          </>
        )}

        {view === 'loading' ? (
          <ol className={styles.track} aria-busy="true" aria-label={t.platform.states.loading}>
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} className={styles.row}>
                <div className={styles.card}>
                  <Skeleton style={{ width: 64, height: 72 }} />
                  <span className={styles.cardBody}>
                    <Skeleton style={{ width: '30%', height: 18 }} />
                    <Skeleton style={{ width: '70%', height: 24 }} />
                    <Skeleton style={{ width: '50%', height: 14 }} />
                  </span>
                </div>
              </li>
            ))}
          </ol>
        ) : view === 'error' ? (
          <StateMessage
            kind="error"
            title={unavailable ? c.unavailableTitle : t.platform.states.errorTitle}
            body={unavailable ? c.unavailableBody : t.platform.states.errorBody}
            action={
              <a href="?" className="btn btn--secondary">
                {t.platform.states.retry}
              </a>
            }
          />
        ) : data.length === 0 ? (
          <StateMessage kind="empty" title={t.platform.states.emptyTitle} body={t.events.empty} />
        ) : shown.length === 0 ? (
          <StateMessage
            kind="filtered"
            title={t.platform.states.filteredTitle}
            body={t.platform.states.filteredBody}
            action={
              <button type="button" className="btn btn--secondary" onClick={() => clear()}>
                {f.clearAll}
              </button>
            }
          />
        ) : (
          <div ref={root} className={styles.timeline}>
            <div className={styles.spine} aria-hidden="true">
              <span className={styles.spineTrack} />
              <span className={styles.spineFill} />
              <span className={styles.spineHead} />
            </div>

            {past.length > 0 && (
              <section className={styles.run} aria-labelledby="run-past">
                <h2 id="run-past" className={styles.runTitle}>
                  {c.pastTitle}
                </h2>
                {(folded > 0 || showAllPast) && past.length > PAST_VISIBLE + 1 && !values.q && !lists.when.includes('past') && (
                  <button type="button" className={styles.earlier} aria-expanded={showAllPast} onClick={() => setShowAllPast((v) => !v)}>
                    {showAllPast ? c.showFewer : c.showEarlier(folded)}
                  </button>
                )}
                {groups(pastShown).map((g) => (
                  <div key={g.key} className={styles.month}>
                    <h3 className={styles.monthTitle}>{monthLabel(g.key)}</h3>
                    <ol className={styles.track}>{g.items.map(row)}</ol>
                  </div>
                ))}
              </section>
            )}

            <div className={styles.today}>
              <span className={styles.todayMark} aria-hidden="true" />
              <p className={styles.todayText}>
                <strong>{c.today}</strong> · {eventDateParts(now, intl).long}
                <span className={styles.todayNote}>{c.todayNote}</span>
              </p>
            </div>

            {!(lists.when.length === 1 && lists.when[0] === 'past') && (
              <section className={styles.run} aria-labelledby="run-upcoming">
                <h2 id="run-upcoming" className={styles.runTitle}>
                  {c.upcomingTitle}
                </h2>
                {upcoming.length === 0 ? (
                  <p className={styles.runEmpty}>{c.noUpcoming}</p>
                ) : (
                  groups(upcoming).map((g) => (
                    <div key={g.key} className={styles.month}>
                      <h3 className={styles.monthTitle}>{monthLabel(g.key)}</h3>
                      <ol className={styles.track}>{g.items.map(row)}</ol>
                    </div>
                  ))
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
