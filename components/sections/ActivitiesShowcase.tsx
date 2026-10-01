'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'
import { useRef } from 'react'
import type { Activity } from '@/content/activities'
import { IconArrowRight } from '@/components/ui/icons'
import { PlaceholderArt, PlaceholderFrame } from '@/components/ui/PhotoPlaceholder'
import { DESKTOP_QUERY, FINE_POINTER_QUERY, MOTION } from '@/lib/motion'
import styles from './Activities.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Layout = 'wide' | 'wide-reverse' | 'pair'

const RATIO: Record<Layout, { label: string; css: string }> = {
  wide: { label: '3:2', css: '3 / 2' },
  'wide-reverse': { label: '3:2', css: '3 / 2' },
  pair: { label: '4:3', css: '4 / 3' },
}

/** Where each image unmasks from: its outer edge. */
const MASK_FROM: Record<Layout, string> = {
  wide: 'inset(0% 100% 0% 0%)',
  'wide-reverse': 'inset(0% 0% 0% 100%)',
  pair: 'inset(100% 0% 0% 0%)',
}

const TILT_MAX = 2
const PARALLAX = 12

/** A varied, repeating rhythm: wide · pair · mirrored wide · pair. */
function toRows(activities: Activity[]) {
  const rows: { layout: Layout; items: Activity[] }[] = []
  let i = 0
  let wide = 0
  while (i < activities.length) {
    const pairNext = rows.length % 2 === 1 && i + 1 < activities.length
    if (pairNext) {
      rows.push({ layout: 'pair', items: activities.slice(i, i + 2) })
      i += 2
    } else {
      rows.push({ layout: wide % 2 === 0 ? 'wide' : 'wide-reverse', items: [activities[i]] })
      wide += 1
      i += 1
    }
  }
  return rows
}

export function ActivitiesShowcase({ activities }: { activities: Activity[] }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const mm = gsap.matchMedia()

      // Each activity arrives as one coordinated moment: photo, accent line, then text.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const threshold = window.innerHeight * 0.85
        gsap.utils.toArray<HTMLElement>('[data-activity]', root).forEach((item) => {
          if (item.getBoundingClientRect().top < threshold) return
          const mask = item.querySelector<HTMLElement>('[data-mask]')
          const tl = gsap.timeline({
            defaults: { ease: MOTION.ease },
            scrollTrigger: { trigger: item, start: 'top 80%', once: true },
          })
          if (mask) {
            tl.fromTo(
              mask,
              { clipPath: mask.dataset.maskFrom ?? MASK_FROM.pair },
              { clipPath: 'inset(0% 0% 0% 0%)', duration: MOTION.mask.duration, clearProps: 'clipPath' },
              0,
            )
          }
          tl.from(item.querySelectorAll('[data-part="accent"]'), { scaleX: 0, duration: 0.6, clearProps: 'transform' }, 0.25).from(
            item.querySelectorAll('[data-part="text"]'),
            { opacity: 0, y: 14, duration: 0.6, stagger: MOTION.rise.stagger, clearProps: 'opacity,transform' },
            0.3,
          )
        })
      })

      // Desktop: a little depth inside each photo frame.
      mm.add(`${DESKTOP_QUERY} and (prefers-reduced-motion: no-preference)`, () => {
        gsap.utils.toArray<HTMLElement>('[data-parallax]', root).forEach((inner) => {
          gsap.fromTo(
            inner,
            { y: -PARALLAX },
            {
              y: PARALLAX,
              ease: 'none',
              scrollTrigger: { trigger: inner.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        })
      })

      // Fine pointers only: a tilt of at most 2°. The pointer is read on the untransformed host
      // and the frame inside it turns, so the frame never slips out from under the pointer at
      // its edges (which would flicker between tilted and flat).
      mm.add(`${DESKTOP_QUERY} and ${FINE_POINTER_QUERY} and (prefers-reduced-motion: no-preference)`, () => {
        const cleanups: (() => void)[] = []
        gsap.utils.toArray<HTMLElement>('[data-tilt]', root).forEach((el) => {
          const frame = el.querySelector<HTMLElement>('[data-mask]')
          if (!frame) return
          gsap.set(frame, { transformPerspective: 1000 })
          const rx = gsap.quickTo(frame, 'rotationX', { duration: 0.5, ease: MOTION.ease })
          const ry = gsap.quickTo(frame, 'rotationY', { duration: 0.5, ease: MOTION.ease })
          const onMove = (e: PointerEvent) => {
            const r = el.getBoundingClientRect()
            ry(((e.clientX - r.left) / r.width - 0.5) * TILT_MAX * 2)
            rx(-((e.clientY - r.top) / r.height - 0.5) * TILT_MAX * 2)
          }
          const onLeave = () => {
            rx(0)
            ry(0)
          }
          el.addEventListener('pointermove', onMove)
          el.addEventListener('pointerleave', onLeave)
          cleanups.push(() => {
            el.removeEventListener('pointermove', onMove)
            el.removeEventListener('pointerleave', onLeave)
            gsap.set(frame, { clearProps: 'transform' })
          })
        })
        return () => cleanups.forEach((fn) => fn())
      })

      return () => mm.revert()
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef} className={styles.list}>
      {toRows(activities).map((row) =>
        row.layout === 'pair' ? (
          <div key={row.items[0].id} className={styles.pair}>
            {row.items.map((a) => (
              <ActivityFeature key={a.id} activity={a} layout="pair" />
            ))}
          </div>
        ) : (
          <ActivityFeature key={row.items[0].id} activity={row.items[0]} layout={row.layout} />
        ),
      )}
    </div>
  )
}

function ActivityFeature({ activity, layout }: { activity: Activity; layout: Layout }) {
  const titleId = `activity-${activity.id}-title`
  const main = activity.photos.main
  return (
    <article id={`activity-${activity.id}`} className={styles.activity} data-layout={layout} data-activity="" aria-labelledby={titleId}>
      <div className={styles.media} data-tilt="">
        <div
          className={styles.mask}
          data-mask=""
          data-mask-from={MASK_FROM[layout]}
          style={{ aspectRatio: RATIO[layout].css }}
        >
          <div className={styles.parallax} data-parallax="">
            <div className={styles.zoom}>
              {main ? (
                <Image
                  src={main.src}
                  alt={main.alt}
                  fill
                  sizes={layout === 'pair' ? '(min-width: 64rem) 42vw, 100vw' : '(min-width: 64rem) 58vw, 100vw'}
                  className={styles.photo}
                />
              ) : (
                <PlaceholderArt nameAr={activity.nameAr} />
              )}
            </div>
          </div>
          {!main && <PlaceholderFrame ratio={RATIO[layout].label} />}
        </div>
      </div>

      <div className={styles.body}>
        <span className={styles.accent} data-part="accent" aria-hidden="true" />
        <h3 id={titleId} className={styles.title} lang="ar" dir="rtl" data-part="text">
          {activity.nameAr}
        </h3>
        <p className={styles.gloss} data-part="text">
          {activity.nameEn}
        </p>
        <p className={styles.description} data-part="text">
          {activity.description}
        </p>
        {activity.stats.length > 0 && (
          <dl className={styles.stats} data-part="text">
            {activity.stats.map((s) => (
              <div key={s.label}>
                <dt>
                  {s.label}
                  <span className={styles.statPeriod}>{s.period}</span>
                </dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {activity.href && (
          <a href={activity.href} className={styles.link} data-part="text">
            Previous editions
            <IconArrowRight className={styles.linkArrow} />
          </a>
        )}
      </div>
    </article>
  )
}
