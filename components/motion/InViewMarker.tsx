'use client'

import { useEffect } from 'react'

/**
 * Touch screens have no hover, so effects that wait for a pointer (the discipline symbols'
 * moving detail, the activity accent lines) would never play on a phone. On hover-less devices
 * this marks matching elements with `data-inview` while they cross the middle band of the
 * viewport, and CSS plays the same effect from that attribute. Pointer devices are untouched.
 */
export function InViewMarker({ selector }: { selector: string }) {
  useEffect(() => {
    const noHover = window.matchMedia('(hover: none)')
    let io: IntersectionObserver | null = null
    const setup = () => {
      io?.disconnect()
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => el.removeAttribute('data-inview'))
      if (!noHover.matches) return
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const el = entry.target as HTMLElement
            if (entry.isIntersecting) el.setAttribute('data-inview', '')
            else el.removeAttribute('data-inview')
          }
        },
        // The band from 30% to 65% down the screen: what the eye is on while scrolling.
        { rootMargin: '-30% 0px -35% 0px' },
      )
      document.querySelectorAll(selector).forEach((el) => io!.observe(el))
    }
    setup()
    noHover.addEventListener('change', setup)
    return () => {
      noHover.removeEventListener('change', setup)
      io?.disconnect()
    }
  }, [selector])
  return null
}
