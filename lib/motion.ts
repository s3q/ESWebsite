/**
 * Motion vocabulary shared by every GSAP timeline. CSS mirrors these values in
 * styles/tokens.css (--ease-*, --dur-*). One easing family keeps the page coherent:
 * power3.out for entrances, power2.inOut for things moving into place, none for scrubs.
 * Each section uses a different *recipe* (mask, rise, rule, parallax) — not the same fade.
 */
export const MOTION = {
  ease: 'power3.out',
  easeInOut: 'power2.inOut',

  start: 'top 85%',
  heading: { duration: 0.7, distance: 24 },
  rise: { duration: 0.6, distance: 16, stagger: 0.08 },
  mask: { duration: 1, scale: 1.06 },
  rule: { duration: 0.9 },
  /** Desktop image parallax, in pixels either side of centre. */
  parallax: 18,
  /** Desktop project-card tilt, in degrees. */
  tiltMax: 2.5,

  hero: {
    introDuration: 1.1,
    pointerMaxRad: (4 * Math.PI) / 180,
    scrub: 0.8,
  },
} as const

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'
export const DESKTOP_QUERY = '(min-width: 64rem)'
export const STACKED_QUERY = 'not all and (min-width: 64rem)'
/** The leadership tree switches from an inset rail to a centred hierarchy at tablet width. */
export const DESKTOP_TREE_QUERY = '(min-width: 48rem)'
