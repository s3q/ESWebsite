import type { MediaImage } from './media'

/**
 * The society's recurring programmes (not dated events — those live in content/events.ts).
 *
 * EDITORIAL STATUS
 * - `nameAr` is the society's own name for each programme and is shown as the title.
 * - `nameEn` is a working English label for readers of the English site. It is NOT an
 *   official title; replace it with the society's preferred wording.
 * - Every `description` is a DRAFT written only from the programme's name
 *   (`descriptionStatus: 'draft'`). Confirm or rewrite each one before launch.
 *   أستوديو الخريجين deliberately has no assumed description.
 * - `stats` must only ever hold real figures with their period. None have been supplied.
 * - `photos.main` / `photos.supporting` take authentic society photographs. Until then the
 *   site shows a clearly labelled placeholder at the right proportions.
 * - `href` links to previous editions or details once such a page exists.
 */

export type ActivityId = 'gathering' | 'programme' | 'graduate-workshops' | 'graduate-studio' | 'evenings' | 'competitions'

export interface ActivityStat {
  value: string
  label: string
  /** e.g. '2024–25'. Required for any count. */
  period: string
}

export interface Activity {
  id: ActivityId
  nameAr: string
  nameEn: string
  description: string
  descriptionStatus: 'draft' | 'confirmed' | 'needs-input'
  photos: { main: MediaImage | null; supporting: MediaImage[] }
  stats: ActivityStat[]
  href: string | null
}

export const ACTIVITIES: Activity[] = [
  {
    id: 'gathering',
    nameAr: 'الملتقى الهندسي',
    nameEn: 'Engineering Gathering',
    description: 'A gathering that brings students from across the engineering disciplines together in one place.',
    descriptionStatus: 'draft',
    photos: { main: null, supporting: [] },
    stats: [],
    href: null,
  },
  {
    id: 'programme',
    nameAr: 'البرنامج الهندسي',
    nameEn: 'Engineering Programme',
    description: 'A structured programme of engineering activities for students across the college.',
    descriptionStatus: 'draft',
    photos: { main: null, supporting: [] },
    stats: [],
    href: null,
  },
  {
    id: 'graduate-workshops',
    nameAr: 'ورش الخريجين',
    nameEn: 'Graduate Workshops',
    description: 'Workshops that connect current students with the society’s graduates.',
    descriptionStatus: 'draft',
    photos: { main: null, supporting: [] },
    stats: [],
    href: null,
  },
  {
    id: 'graduate-studio',
    nameAr: 'أستوديو الخريجين',
    nameEn: 'Graduate Studio',
    // Needs the society's own description: the name alone does not say what the programme does.
    description: 'A description of this programme will be added by the society.',
    descriptionStatus: 'needs-input',
    photos: { main: null, supporting: [] },
    stats: [],
    href: null,
  },
  {
    id: 'evenings',
    nameAr: 'الأمسيات',
    nameEn: 'Evenings',
    description: 'Evening sessions that bring the society’s members together.',
    descriptionStatus: 'draft',
    photos: { main: null, supporting: [] },
    stats: [],
    href: null,
  },
  {
    id: 'competitions',
    nameAr: 'المسابقات',
    nameEn: 'Competitions',
    description: 'Competitions that invite students to put their engineering skills to the test.',
    descriptionStatus: 'draft',
    photos: { main: null, supporting: [] },
    stats: [],
    href: null,
  },
]

export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a])) as Record<ActivityId, Activity>

/**
 * Previous editions of these programmes, for the /activities archive. Add one record per
 * edition as it is documented; the archive's programme and year filters come from this data.
 */
export interface ActivityEdition {
  id: string
  activity: ActivityId
  title: string
  year: number
  summary?: string
  image?: MediaImage
  href?: string
}

export const ACTIVITY_EDITIONS: ActivityEdition[] = []
