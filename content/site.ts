/**
 * Site-wide identity and wiring. Anything marked `null` has no verified destination yet;
 * components hide or downgrade the related UI instead of rendering a broken link.
 */

/** Homepage sections that appear in the navbar, in page order. */
export const SECTION_LINKS = [
  { id: 'events', label: 'Events' },
  { id: 'projects', label: 'Projects' },
  { id: 'disciplines', label: 'Disciplines' },
  { id: 'activities', label: 'Activities' },
] as const

export type SectionId = (typeof SECTION_LINKS)[number]['id']

/** Separate pages reachable from the navbar. */
export const PAGE_LINKS = [{ href: '/about', label: 'About' }] as const

/** On the homepage a section link is a plain fragment; elsewhere it returns to the homepage. */
export function sectionHref(id: string, onHome: boolean) {
  return onHome ? `#${id}` : `/#${id}`
}

export const SITE = {
  name: 'Engineering Society',
  affiliation: 'Sultan Qaboos University',
  description:
    'The Engineering Society at Sultan Qaboos University — discover events, share projects, preserve achievements and connect across engineering disciplines.',

  /**
   * Membership registration (PRD UC-01) is not built yet. While this is null, the
   * "Join the Society" actions lead to the #join invitation and a clearly labelled
   * preview dialog. Set it to the real route (for example '/join') once it exists.
   */
  membershipUrl: null as string | null,

  /** No sign-in destination exists yet, so the navbar omits sign-in. */
  signInUrl: null as string | null,

  /**
   * Draft 1 used an invented email address. Only add entries here once the society
   * confirms them; the footer renders nothing otherwise.
   */
  contact: [] as { label: string; href: string }[],
} as const
