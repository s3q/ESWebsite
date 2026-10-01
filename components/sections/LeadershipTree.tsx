'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import { LEADERSHIP, type Position } from '@/content/structure'
import { Portrait } from '@/components/ui/Portrait'
import { DESKTOP_TREE_QUERY, MOTION } from '@/lib/motion'
import styles from './LeadershipTree.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

function Profile({ position, size, bilingual }: { position: Position; size: 'lg' | 'md'; bilingual: boolean }) {
  const holder = position.holder
  return (
    <div className={styles.profile} data-portrait-host="" data-vacant={!holder || undefined}>
      <Portrait person={holder} size={size} className={styles.portrait} />
      <div className={styles.text}>
        <p className={styles.role}>
          {position.titleEn}
          {bilingual && (
            <span className={styles.roleAr} lang="ar" dir="rtl">
              {position.titleAr}
            </span>
          )}
        </p>
        <p className={styles.name}>{holder?.name ?? 'Name to be announced'}</p>
        {position.responsibility && <p className={styles.responsibility}>{position.responsibility}</p>}
      </div>
    </div>
  )
}

/**
 * President above, three Vice Presidents beneath, joined by fine connectors. A nested list, so
 * the hierarchy is real structure; the lines are decoration and draw in order on arrival.
 */
export function LeadershipTree({ leadership = LEADERSHIP, bilingual = false }: { leadership?: typeof LEADERSHIP; bilingual?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (root.getBoundingClientRect().top < window.innerHeight * 0.8) return
        const wide = window.matchMedia(DESKTOP_TREE_QUERY).matches
        const tl = gsap.timeline({
          defaults: { ease: MOTION.ease },
          scrollTrigger: { trigger: root, start: 'top 78%', once: true },
        })
        tl.from('[data-part="president"]', { opacity: 0, y: 18, duration: 0.6, clearProps: 'opacity,transform' })
          .from('[data-part="stem"]', { scaleY: 0, transformOrigin: 'top center', duration: 0.35, clearProps: 'transform' }, '-=0.15')
          .from(
            '[data-part="bar"]',
            wide
              ? { scaleX: 0, transformOrigin: 'center center', duration: 0.5, clearProps: 'transform' }
              : { scaleY: 0, transformOrigin: 'top center', duration: 0.6, clearProps: 'transform' },
          )
          .from(
            '[data-part="drop"]',
            wide
              ? { scaleY: 0, transformOrigin: 'top center', duration: 0.3, stagger: 0.06, clearProps: 'transform' }
              : { scaleX: 0, transformOrigin: 'left center', duration: 0.3, stagger: 0.1, clearProps: 'transform' },
            '-=0.15',
          )
          .from('[data-part="vp"]', { opacity: 0, y: 16, duration: 0.55, stagger: 0.1, clearProps: 'opacity,transform' }, '-=0.2')
      })
      return () => mm.revert()
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef} className={styles.tree}>
      <ul className={styles.root} aria-label="Senior leadership">
        <li className={styles.top}>
          <div className={styles.president} data-part="president">
            <Profile position={leadership.president} size="lg" bilingual={bilingual} />
          </div>
          <span className={styles.stem} data-part="stem" aria-hidden="true" />
          <div className={styles.branch}>
            <span className={styles.bar} data-part="bar" aria-hidden="true" />
            <ul className={styles.vps} aria-label="Vice Presidents">
              {leadership.vicePresidents.map((vp) => (
                <li key={vp.id} className={styles.vp}>
                  <span className={styles.drop} data-part="drop" aria-hidden="true" />
                  <div data-part="vp">
                    <Profile position={vp} size="md" bilingual={bilingual} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </li>
      </ul>
    </div>
  )
}
