'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'
import { useRef } from 'react'
import { DESKTOP_QUERY, FINE_POINTER_QUERY } from '@/lib/motion'
import styles from './Overview.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * Scroll depth per layer, in px across the section's whole pass through the viewport. The
 * photograph drifts slowest (it is furthest away); the drawn engineering marks move against
 * the scroll, so they read as nearer than the text.
 */
const DEPTH = {
  // The photograph only drifts downward, so the figure's head never leaves the frame.
  photo: { from: 0, to: 96 },
  grid: { from: -28, to: 28 },
  glow: { from: -80, to: 64 },
  mid: { from: 70, to: -70 },
  near: { from: 130, to: -130 },
} as const

/** Pointer depth (desktop, fine pointers): how far each layer leans toward the cursor. */
const LEAN = { photo: -8, glow: 18, mid: 12, near: 22 } as const

/**
 * The overview's backdrop: the society's own photograph in a blue atmosphere, a blueprint
 * grid, a soft light and a few drawn engineering marks, each on its own depth plane.
 * Decorative throughout (aria-hidden); the section's text never depends on it.
 */
export function OverviewBackdrop({ src }: { src: string }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const section = root?.parentElement
      if (!root || !section) return
      const mm = gsap.matchMedia()

      mm.add(
        { desktop: DESKTOP_QUERY, finePointer: FINE_POINTER_QUERY, motion: '(prefers-reduced-motion: no-preference)' },
        (ctx) => {
          const { desktop, finePointer, motion } = ctx.conditions as Record<string, boolean>
          if (!motion) return
          // Phones and tablets get the same depth at under half the travel.
          const amp = desktop ? 1 : 0.4
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          })
          ;(Object.keys(DEPTH) as (keyof typeof DEPTH)[]).forEach((layer) => {
            const { from, to } = DEPTH[layer]
            tl.fromTo(`[data-depth="${layer}"]`, { y: from * amp }, { y: to * amp }, 0)
          })
          // A slow dolly-in on the photograph as the section passes.
          tl.fromTo('[data-depth="photo"] img', { scale: 1.1 }, { scale: 1.02 }, 0)

          if (!desktop || !finePointer) return
          const leaners = (Object.keys(LEAN) as (keyof typeof LEAN)[]).flatMap((layer) =>
            gsap.utils.toArray<HTMLElement>(`[data-depth="${layer}"]`, root).map((el) => ({
              to: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
              amount: LEAN[layer],
            })),
          )
          const onMove = (e: PointerEvent) => {
            const r = section.getBoundingClientRect()
            const nx = (e.clientX - r.left) / r.width - 0.5
            leaners.forEach((l) => l.to(nx * l.amount))
          }
          const onLeave = () => leaners.forEach((l) => l.to(0))
          section.addEventListener('pointermove', onMove)
          section.addEventListener('pointerleave', onLeave)
          return () => {
            section.removeEventListener('pointermove', onMove)
            section.removeEventListener('pointerleave', onLeave)
          }
        },
      )
      return () => mm.revert()
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef} className={styles.backdrop} aria-hidden="true">
      <div className={styles.photoLayer} data-depth="photo">
        <Image src={src} alt="" fill sizes="100vw" quality={90} className={styles.photo} />
      </div>
      <div className={styles.grade} />
      <div className={styles.grid} data-depth="grid" />
      <div className={styles.glow} data-depth="glow" />
      <div className={styles.shade} />

      {/* Drawn marks from the engineering vocabulary: a datum ring, a dimension line, a block
          and the logo's leaf. Line only, pale, and never behind the text column. */}
      <svg className={`${styles.mark} ${styles.ring}`} data-depth="mid" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="62" />
        <circle cx="80" cy="80" r="44" className={styles.spin} strokeDasharray="3 7" />
        <circle cx="80" cy="80" r="3" />
        <path d="M80 4v32M80 124v32M4 80h32M124 80h32" />
      </svg>
      <svg className={`${styles.mark} ${styles.dimension}`} data-depth="near" viewBox="0 0 240 40">
        <path d="M8 6v28M232 6v28M8 20h224" />
        <path d="M8 20l10-5M8 20l10 5M232 20l-10-5M232 20l-10 5" />
        <path d="M120 16v8" />
      </svg>
      <svg className={`${styles.mark} ${styles.block}`} data-depth="near" viewBox="0 0 80 80">
        <path d="M40 6l30 17v34L40 74 10 57V23z" />
        <path d="M10 23l30 17 30-17M40 40v34" />
      </svg>
      <svg className={`${styles.mark} ${styles.leaf}`} data-depth="mid" viewBox="0 0 60 60">
        <path d="M4 56V30A26 26 0 0130 4h0a26 26 0 0126 26h0a26 26 0 01-26 26z" />
      </svg>
    </div>
  )
}
