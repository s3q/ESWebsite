import type { Localized } from '@/lib/i18n'

/**
 * Society-wide figures. Data-driven: each entry renders in the strip under the hero (or on the
 * About page) in the same style. NEVER add a figure without a source.
 *
 * - A `count` with a number counts up once as the strip enters the viewport.
 * - A `count` whose value is `null` has no verified source yet. It renders as a clearly
 *   labelled placeholder ("Verified figure to come"), never as a guess or a zero.
 * - A `year-range` is shown as written and never animates.
 * - `note` renders as a visible footnote; use it whenever a figure needs qualifying.
 */

export type StatIcon = 'members' | 'visitors' | 'projects' | 'events'

export type StatValue =
  | { kind: 'count'; value: number | null; /** e.g. '+' for "1,200+" */ suffix?: string }
  | { kind: 'year-range'; from: number; to: number }

export interface SocietyStat {
  id: string
  icon?: StatIcon
  stat: StatValue
  label: Localized
  /** e.g. { en: '2025–26 academic year', ar: 'العام الأكاديمي 2025–2026' }. Shown under the label. */
  reportingPeriod: Localized | null
  /** Where the figure comes from, for editors. Not rendered. */
  source: string | null
  /** A qualification that must stay visible next to the figure. */
  note?: Localized
}

/**
 * The homepage strip. None of these four has a verified source in the project yet:
 * - members: the society's membership register (registration is a Phase 1 platform feature);
 * - visitors: needs real site analytics (e.g. the host's analytics). Do not use a hand-made
 *   counter: it would count reloads and bots, not visitors;
 * - projects / events: the society's own records. The project and event entries on this site
 *   are labelled samples and must not be counted.
 * Set `value` (and `reportingPeriod`, `source`) when a figure is confirmed.
 */
export const SOCIETY_STATS: SocietyStat[] = [
  {
    id: 'members',
    icon: 'members',
    stat: { kind: 'count', value: null },
    label: { en: 'Society members', ar: 'أعضاء الجمعية' },
    reportingPeriod: null,
    source: null,
  },
  {
    id: 'visitors',
    icon: 'visitors',
    stat: { kind: 'count', value: null },
    label: { en: 'Website visitors', ar: 'زوّار الموقع' },
    reportingPeriod: null,
    source: null,
  },
  {
    id: 'projects',
    icon: 'projects',
    stat: { kind: 'count', value: null },
    label: { en: 'Society projects', ar: 'مشاريع الجمعية' },
    reportingPeriod: null,
    source: null,
  },
  {
    id: 'events',
    icon: 'events',
    stat: { kind: 'count', value: null },
    label: { en: 'Society events', ar: 'فعاليات الجمعية' },
    reportingPeriod: null,
    source: null,
  },
]

const HISTORICAL_NOTE: Localized = {
  en: 'As recorded in the society’s own overview. The date these counts were reported is not stated, so they may not be current totals.',
  ar: 'وفق ما ورد في نبذة الجمعية عن نفسها. لم يُذكر تاريخ رصد هذه الأعداد، لذا قد لا تمثّل المجموع الحالي.',
}

/** Facts from the society's own overview (Draft 4), shown on the About page. */
export const SOCIETY_FACTS: SocietyStat[] = [
  {
    id: 'established',
    stat: { kind: 'year-range', from: 2000, to: 2001 },
    label: { en: 'Academic year the society was established', ar: 'العام الأكاديمي لتأسيس الجمعية' },
    reportingPeriod: null,
    source: 'Society overview supplied for Draft 4',
  },
  {
    id: 'societies',
    stat: { kind: 'count', value: 7 },
    label: { en: 'Engineering societies it works with', ar: 'جمعيات هندسية تعمل معها' },
    reportingPeriod: null,
    source: 'Society overview supplied for Draft 4',
  },
  {
    id: 'exhibitions',
    stat: { kind: 'count', value: 6 },
    label: { en: 'Engineering Exhibitions on record', ar: 'معارض هندسية موثّقة' },
    reportingPeriod: null,
    source: 'Society overview supplied for Draft 4 (reporting date unknown)',
    note: HISTORICAL_NOTE,
  },
  {
    id: 'gatherings',
    stat: { kind: 'count', value: 6 },
    label: { en: 'Engineering Gatherings on record', ar: 'ملتقيات هندسية موثّقة' },
    reportingPeriod: null,
    source: 'Society overview supplied for Draft 4 (reporting date unknown)',
    note: HISTORICAL_NOTE,
  },
]
