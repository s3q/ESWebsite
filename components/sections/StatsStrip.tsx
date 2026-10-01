'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import { SOCIETY_STATS, type SocietyStat } from '@/content/stats'
import { MOTION } from '@/lib/motion'
import styles from './StatsStrip.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const SUPERSCRIPTS = ['¹', '²', '³', '⁴', '⁵']

function StatFigure({ stat }: { stat: SocietyStat['stat'] }) {
  if (stat.kind === 'year-range') {
    const short = `${stat.from}–${String(stat.to).slice(-2)}`
    return (
      <>
        <span aria-hidden="true">{short}</span>
        <span className="visually-hidden">
          {stat.from} to {stat.to}
        </span>
      </>
    )
  }
  return (
    <>
      <span aria-hidden="true" data-count={stat.value}>
        {stat.value}
      </span>
      <span className="visually-hidden">{stat.value}</span>
    </>
  )
}

/**
 * A compact, factual bridge between the hero and the overview. Values are rendered final on
 * the server; quantities count up once as the strip arrives (never the year).
 */
export function StatsStrip({ stats = SOCIETY_STATS }: { stats?: SocietyStat[] }) {
  const rootRef = useRef<HTMLElement>(null)

  // Identical qualifications share one footnote.
  const notes = [...new Set(stats.map((s) => s.note).filter((n): n is string => Boolean(n)))]
  const marker = (note?: string) => (note ? SUPERSCRIPTS[notes.indexOf(note)] : null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (root.getBoundingClientRect().top < window.innerHeight * 0.85) return
        const counters = gsap.utils.toArray<HTMLElement>('[data-count]', root)
        counters.forEach((el) => (el.textContent = '0'))

        const tl = gsap.timeline({
          defaults: { ease: MOTION.ease },
          scrollTrigger: { trigger: root, start: MOTION.start, once: true },
        })
        tl.from('[data-part="rule"]', { scaleX: 0, duration: MOTION.rule.duration, clearProps: 'transform' }, 0)
          .from('[data-part="sep"]', { scaleY: 0, duration: 0.7, clearProps: 'transform' }, 0.1)
          .from(
            '[data-part="figure"]',
            { opacity: 0, y: 20, duration: 0.7, stagger: MOTION.rise.stagger, clearProps: 'opacity,transform' },
            0.1,
          )
        counters.forEach((el, i) => {
          const target = Number(el.dataset.count)
          const proxy = { v: 0 }
          tl.to(
            proxy,
            {
              v: target,
              duration: 1.1,
              ease: 'power2.out',
              onUpdate: () => {
                el.textContent = String(Math.round(proxy.v))
              },
              onComplete: () => {
                el.textContent = String(target)
              },
            },
            0.25 + i * MOTION.rise.stagger,
          )
        })
        return () => counters.forEach((el) => (el.textContent = el.dataset.count ?? el.textContent))
      })
      return () => mm.revert()
    },
    { scope: rootRef },
  )

  return (
    <section ref={rootRef} id="at-a-glance" className={styles.strip} aria-labelledby="stats-title">
      <div className="container">
        <h2 id="stats-title" className="visually-hidden">
          The society at a glance
        </h2>
        <span className={styles.rule} data-part="rule" aria-hidden="true" />
        <dl className={styles.grid}>
          {stats.map((s) => (
            <div key={s.id} className={styles.item} data-kind={s.stat.kind}>
              <span className={styles.sep} data-part="sep" aria-hidden="true" />
              <dt className={styles.label}>
                {s.label}
                {s.note && (
                  <sup className={styles.marker}>
                    <span aria-hidden="true">{marker(s.note)}</span>
                    <span className="visually-hidden"> (see note {notes.indexOf(s.note) + 1})</span>
                  </sup>
                )}
                {s.reportingPeriod && <span className={styles.period}>{s.reportingPeriod}</span>}
              </dt>
              <dd className={styles.figure} data-part="figure" data-kind={s.stat.kind}>
                <StatFigure stat={s.stat} />
              </dd>
            </div>
          ))}
        </dl>
        {notes.length > 0 && (
          <div className={styles.notes}>
            {notes.map((n, i) => (
              <p key={n} className={styles.note}>
                <span aria-hidden="true">{SUPERSCRIPTS[i]}</span>
                <span className="visually-hidden">Note {i + 1}: </span> {n}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
