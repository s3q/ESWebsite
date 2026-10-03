'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import type { SocietyStat } from '@/content/stats'
import { useI18n } from '@/components/i18n/I18nProvider'
import { StatIcon } from '@/components/ui/StatIcon'
import { formatCount } from '@/lib/format'
import { MOTION } from '@/lib/motion'
import styles from './StatsStrip.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const SUPERSCRIPTS = ['¹', '²', '³', '⁴', '⁵']

function StatFigure({ stat }: { stat: SocietyStat['stat'] }) {
  const { t, intl } = useI18n()
  if (stat.kind === 'year-range') {
    const short = `${stat.from}–${String(stat.to).slice(-2)}`
    return (
      <span className={styles.number}>
        <span aria-hidden="true" dir="ltr">
          {short}
        </span>
        <span className="visually-hidden">{t.stats.yearRange(stat.from, stat.to)}</span>
      </span>
    )
  }
  if (stat.value === null) {
    // No verified source yet: say so plainly instead of showing a number.
    return (
      <span className={styles.pending}>
        <span className={styles.dash} aria-hidden="true">
          —
        </span>
        <span className={styles.pendingTag}>
          <span className="status-dot" aria-hidden="true" />
          {t.stats.placeholder}
        </span>
      </span>
    )
  }
  const final = formatCount(stat.value, intl) + (stat.suffix ?? '')
  return (
    <span className={styles.number}>
      <span aria-hidden="true" dir="ltr" data-count={stat.value} data-suffix={stat.suffix ?? ''}>
        {final}
      </span>
      <span className="visually-hidden">{final}</span>
    </span>
  )
}

/**
 * Society figures as a factual strip: large numbers, fine separators, no boxes. Real figures
 * count up once as the strip arrives (a year never animates); figures without a verified
 * source show a labelled placeholder. Values are rendered final on the server.
 */
export function StatsStrip({ stats, kind = 'stats' }: { stats: SocietyStat[]; kind?: 'stats' | 'facts' }) {
  const rootRef = useRef<HTMLElement>(null)
  const { t, l, intl, dir } = useI18n()

  // Identical qualifications share one footnote.
  const notes = [...new Map(stats.filter((s) => s.note).map((s) => [s.note!.en, s.note!])).values()]
  const noteIndex = (note?: SocietyStat['note']) => (note ? notes.findIndex((n) => n.en === note.en) : -1)
  const hasPending = stats.some((s) => s.stat.kind === 'count' && s.stat.value === null)
  const hasDemo = stats.some((s) => s.demo)
  const hasRange = stats.some((s) => s.stat.kind === 'year-range')

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (root.getBoundingClientRect().top < window.innerHeight * 0.85) return
        // The count writes into React's own text node, so a later re-render still finds it.
        const counters = gsap.utils.toArray<HTMLElement>('[data-count]', root).map((el) => ({
          node: el.firstChild as Text,
          target: Number(el.dataset.count),
          suffix: el.dataset.suffix ?? '',
        }))
        const write = (c: (typeof counters)[number], v: number) => {
          if (c.node) c.node.nodeValue = formatCount(v, intl) + c.suffix
        }
        counters.forEach((c) => write(c, 0))

        const tl = gsap.timeline({
          defaults: { ease: MOTION.ease },
          scrollTrigger: { trigger: root, start: MOTION.start, once: true },
        })
        tl.from('[data-part="rule"]', { scaleX: 0, duration: MOTION.rule.duration, clearProps: 'transform' }, 0)
          .from('[data-part="sep"]', { scaleY: 0, duration: 0.7, clearProps: 'transform' }, 0.1)
          .from(
            '[data-part="icon"] [pathLength]',
            { strokeDashoffset: 1, duration: 0.9, stagger: 0.04, ease: MOTION.easeInOut, clearProps: 'strokeDashoffset' },
            0.05,
          )
          .from(
            '[data-part="figure"]',
            { opacity: 0, y: 20, duration: 0.7, stagger: MOTION.rise.stagger, clearProps: 'opacity,transform' },
            0.15,
          )
        counters.forEach((c, i) => {
          const proxy = { v: 0 }
          tl.to(
            proxy,
            {
              v: c.target,
              duration: 1.4,
              ease: 'power3.out',
              onUpdate: () => write(c, Math.round(proxy.v)),
              onComplete: () => write(c, c.target),
            },
            0.3 + i * MOTION.rise.stagger,
          )
        })
        return () => counters.forEach((c) => write(c, c.target))
      })
      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [dir, intl], revertOnUpdate: true },
  )

  const titleId = `${kind}-title`
  return (
    <section
      ref={rootRef}
      id={kind === 'stats' ? 'at-a-glance' : 'in-brief'}
      className={styles.strip}
      aria-labelledby={titleId}
    >
      <div className="container">
        <h2 id={titleId} className="visually-hidden">
          {kind === 'stats' ? t.stats.title : t.stats.factsTitle}
        </h2>
        <span className={styles.rule} data-part="rule" aria-hidden="true" />
        <dl className={styles.grid} data-has-range={hasRange || undefined}>
          {stats.map((s) => {
            const n = noteIndex(s.note)
            return (
              <div key={s.id} className={styles.item} data-kind={s.stat.kind}>
                <dt className={styles.label}>
                  {l(s.label)}
                  {n >= 0 && (
                    <sup className={styles.marker}>
                      <span aria-hidden="true">{SUPERSCRIPTS[n]}</span>
                      <span className="visually-hidden"> {t.stats.seeNote(n + 1)}</span>
                    </sup>
                  )}
                  {s.reportingPeriod && <span className={styles.period}>{l(s.reportingPeriod)}</span>}
                </dt>
                <dd className={styles.value}>
                  <span className={styles.sep} data-part="sep" aria-hidden="true" />
                  {s.icon && (
                    <span className={styles.icon} data-part="icon" aria-hidden="true">
                      <StatIcon id={s.icon} />
                    </span>
                  )}
                  <span className={styles.figure} data-part="figure" data-kind={s.stat.kind}>
                    <StatFigure stat={s.stat} />
                  </span>
                  {s.demo && <span className={`chip chip--sample ${styles.demoTag}`}>{t.stats.demoTag}</span>}
                </dd>
              </div>
            )
          })}
        </dl>
        {(notes.length > 0 || hasPending || hasDemo) && (
          <div className={styles.notes}>
            {notes.map((note, i) => (
              <p key={note.en} className={styles.note}>
                <span aria-hidden="true">{SUPERSCRIPTS[i]}</span>
                <span className="visually-hidden">{t.stats.note(i + 1)} </span> {l(note)}
              </p>
            ))}
            {hasDemo && (
              <p className={styles.note}>
                <span className="status-dot" aria-hidden="true" />
                {t.stats.demoNote}
              </p>
            )}
            {hasPending && (
              <p className={styles.note}>
                <span className="status-dot" aria-hidden="true" />
                {t.stats.pendingNote}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
