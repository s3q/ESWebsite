'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MOTION } from '@/lib/motion'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * The page's scroll-reveal recipes. Sections opt in with data-reveal, and each recipe fits
 * its purpose rather than repeating one fade:
 *   heading  a section title rises into place
 *   rise     supporting copy follows, shorter and quieter
 *   stagger  a block of paragraphs arrives one after another
 *   points   fine rules draw across, then their short texts rise
 *   chart    the About page's committees: trunk, bus, spines and ticks draw; names fade in
 *   feature  Events' lead item: the drawing unmasks, the date lifts in, the text follows
 *   rows     the schedule: each rule draws across, then its row slides in from the left
 *   index    disciplines: rules draw while each symbol settles into scale
 *   key      the closing colour key draws from left to right
 * Everything plays once. Content is visible without JavaScript and under reduced motion:
 * initial states are applied here, and only to elements that start below the fold.
 * (Projects run their own mask/parallax/tilt in ProjectsBrowser, on separate elements.)
 */
export function ScrollReveals() {
  useGSAP(() => {
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const threshold = window.innerHeight * 0.85
      const once = (trigger: Element) => ({ trigger, start: MOTION.start, once: true })
      const parts = (el: Element, name: string) => gsap.utils.toArray<HTMLElement>(el.querySelectorAll(`[data-part="${name}"]`))

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        if (el.getBoundingClientRect().top < threshold) return
        const recipe = el.dataset.reveal

        if (recipe === 'heading' || recipe === 'rise') {
          const cfg = recipe === 'heading' ? MOTION.heading : MOTION.rise
          gsap.from(el, {
            opacity: 0,
            y: cfg.distance,
            duration: cfg.duration,
            ease: MOTION.ease,
            delay: recipe === 'rise' ? 0.08 : 0,
            clearProps: 'opacity,transform',
            scrollTrigger: once(el),
          })
          return
        }

        if (recipe === 'stagger') {
          gsap.from(el.children, {
            opacity: 0,
            y: MOTION.rise.distance,
            duration: MOTION.rise.duration,
            stagger: 0.1,
            ease: MOTION.ease,
            clearProps: 'opacity,transform',
            scrollTrigger: once(el),
          })
          return
        }

        if (recipe === 'points') {
          const tl = gsap.timeline({ scrollTrigger: once(el), defaults: { ease: MOTION.ease } })
          tl.from(parts(el, 'rule'), { scaleX: 0, duration: MOTION.rule.duration, stagger: 0.1, clearProps: 'transform' }, 0).from(
            parts(el, 'text'),
            { opacity: 0, y: 10, duration: 0.55, stagger: 0.05, clearProps: 'opacity,transform' },
            0.25,
          )
          return
        }

        if (recipe === 'chart') {
          const tl = gsap.timeline({ scrollTrigger: once(el), defaults: { ease: MOTION.ease } })
          tl.from(parts(el, 'trunk'), { scaleY: 0, transformOrigin: 'top center', duration: 0.35, stagger: 0.3, clearProps: 'transform' }, 0)
            .from(parts(el, 'bus'), { scaleX: 0, duration: 0.6, clearProps: 'transform' }, 0.4)
            .from(parts(el, 'spine'), { scaleY: 0, duration: 0.5, stagger: 0.04, clearProps: 'transform' }, 0.7)
            .from(parts(el, 'tick'), { scaleX: 0, duration: 0.3, stagger: 0.04, clearProps: 'transform' }, 0.9)
            .from(parts(el, 'node'), { opacity: 0, y: 10, duration: 0.5, stagger: 0.05, clearProps: 'opacity,transform' }, 0.25)
          return
        }

        if (recipe === 'feature') {
          const tl = gsap.timeline({ scrollTrigger: once(el), defaults: { ease: MOTION.ease } })
          tl.fromTo(
            parts(el, 'media'),
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: MOTION.mask.duration, clearProps: 'clipPath' },
            0,
          )
            .from(parts(el, 'date'), { opacity: 0, y: 40, duration: 0.8, clearProps: 'opacity,transform' }, 0.3)
            .from(
              parts(el, 'text'),
              { opacity: 0, y: MOTION.rise.distance, duration: MOTION.rise.duration, stagger: MOTION.rise.stagger, clearProps: 'opacity,transform' },
              0.2,
            )
          return
        }

        if (recipe === 'rows' || recipe === 'index') {
          const items = gsap.utils.toArray<HTMLElement>(el.children)
          const tl = gsap.timeline({ scrollTrigger: once(el), defaults: { ease: MOTION.ease } })
          items.forEach((item, i) => {
            const at = i * (recipe === 'rows' ? 0.12 : 0.06)
            tl.from(parts(item, 'rule'), { scaleX: 0, duration: MOTION.rule.duration, clearProps: 'transform' }, at)
            if (recipe === 'rows') {
              tl.from(parts(item, 'row'), { opacity: 0, x: -16, duration: 0.6, clearProps: 'opacity,transform' }, at + 0.12)
            } else {
              const symbol = item.querySelector('svg')
              if (symbol) tl.from(symbol, { opacity: 0, scale: 0.86, duration: 0.5, transformOrigin: '50% 50%', clearProps: 'opacity,transform' }, at + 0.08)
              tl.from(parts(item, 'text'), { opacity: 0, duration: 0.5, clearProps: 'opacity' }, at + 0.14)
            }
          })
          return
        }

        if (recipe === 'key') {
          gsap.from(el.children, {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: 0.7,
            ease: MOTION.easeInOut,
            stagger: 0.09,
            clearProps: 'transform',
            scrollTrigger: once(el),
          })
        }
      })
    })

    // Trigger positions depend on final text metrics and image sizes.
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh).catch(() => {})
    window.addEventListener('load', refresh)

    return () => {
      window.removeEventListener('load', refresh)
      mm.revert()
    }
  })

  return null
}
