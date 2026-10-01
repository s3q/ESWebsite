/**
 * Society-wide figures shown in the strip under the hero. Data-driven: add current
 * membership, activity or participation totals here with their reporting period, and they
 * render in the same style. Never add a figure without a source.
 *
 * - `count` values count up once when they enter the viewport.
 * - `year-range` values are shown as written and never animate.
 * - `note` renders as a visible footnote; use it whenever a figure needs qualifying.
 */

export type StatValue = { kind: 'count'; value: number } | { kind: 'year-range'; from: number; to: number }

export interface SocietyStat {
  id: string
  stat: StatValue
  label: string
  /** e.g. '2025–26 academic year'. Shown beneath the label when present. */
  reportingPeriod: string | null
  /** Where the figure comes from, for editors. Not rendered. */
  source: string
  /** A qualification that must stay visible next to the figure. */
  note?: string
}

const HISTORICAL_NOTE =
  'As recorded in the society’s own overview. The date these counts were reported is not stated, so they may not be current totals.'

export const SOCIETY_STATS: SocietyStat[] = [
  {
    id: 'established',
    stat: { kind: 'year-range', from: 2000, to: 2001 },
    label: 'Academic year the society was established',
    reportingPeriod: null,
    source: 'Society overview supplied for Draft 4',
  },
  {
    id: 'societies',
    stat: { kind: 'count', value: 7 },
    label: 'Engineering societies it works with',
    reportingPeriod: null,
    source: 'Society overview supplied for Draft 4',
  },
  {
    id: 'exhibitions',
    stat: { kind: 'count', value: 6 },
    label: 'Engineering Exhibitions on record',
    reportingPeriod: null,
    source: 'Society overview supplied for Draft 4 (reporting date unknown)',
    note: HISTORICAL_NOTE,
  },
  {
    id: 'gatherings',
    stat: { kind: 'count', value: 6 },
    label: 'Engineering Gatherings on record',
    reportingPeriod: null,
    source: 'Society overview supplied for Draft 4 (reporting date unknown)',
    note: HISTORICAL_NOTE,
  },
]
