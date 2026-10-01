import type { MediaImage } from './media'

/**
 * The society's organisation, as structured data. Both the homepage leadership tree and the
 * About page chart render from here; nothing is positioned by hand.
 *
 * ROSTER STATUS: no names, portraits, responsibilities or term have been supplied. Every
 * position is therefore vacant (`holder: null`) and renders as an intentional placeholder.
 * Fill in `holder` (and optionally `responsibility`) as the society confirms its roster.
 *
 * HIERARCHY NOTES
 * - Senior leadership is one President and three Vice Presidents (the homepage requirement).
 * - The supplied brief listed فريق التصوير twice. It appears once here, under اللجنة الإعلامية,
 *   until the society confirms whether a second team was intended and where it belongs.
 * - Committee chairs and deputies are added to `roles` only when the actual roster specifies
 *   them. No committee is assumed to have a particular number of deputies.
 */

export interface Person {
  name: string
  portrait: MediaImage | null
  /** CSS object-position for consistent head-and-shoulders crops, e.g. '50% 28%'. */
  portraitFocus?: string
}

export interface Position {
  id: string
  titleEn: string
  titleAr: string
  holder: Person | null
  /** Optional subtitle, shown only when supplied. */
  responsibility?: string | null
}

export interface Team {
  id: string
  nameAr: string
  nameEn: string
}

export interface CommitteeRole {
  titleEn: string
  titleAr?: string
  holder: Person | null
}

export interface Committee {
  id: string
  nameAr: string
  /** Working English label, not an official title. */
  nameEn: string
  roles: CommitteeRole[]
  teams: Team[]
}

export const SENIOR_LEADERSHIP = { nameAr: 'الإدارة العليا', nameEn: 'Senior leadership' } as const

export const LEADERSHIP: {
  /** e.g. '2026–27 academic year'. Hidden while null. */
  term: string | null
  president: Position
  vicePresidents: Position[]
} = {
  term: null,
  president: { id: 'president', titleEn: 'President', titleAr: 'الرئيس', holder: null },
  vicePresidents: [
    { id: 'vice-president-1', titleEn: 'Vice President', titleAr: 'نائب الرئيس', holder: null },
    { id: 'vice-president-2', titleEn: 'Vice President', titleAr: 'نائب الرئيس', holder: null },
    { id: 'vice-president-3', titleEn: 'Vice President', titleAr: 'نائب الرئيس', holder: null },
  ],
}

export const COMMITTEES: Committee[] = [
  { id: 'finance', nameAr: 'اللجنة المالية', nameEn: 'Finance Committee', roles: [], teams: [] },
  {
    id: 'media',
    nameAr: 'اللجنة الإعلامية',
    nameEn: 'Media Committee',
    roles: [],
    teams: [
      { id: 'photography', nameAr: 'فريق التصوير', nameEn: 'Photography Team' },
      { id: 'marketing', nameAr: 'فريق التسويق', nameEn: 'Marketing Team' },
    ],
  },
  {
    id: 'support',
    nameAr: 'لجنة الدعم والإسناد',
    nameEn: 'Support Committee',
    roles: [],
    teams: [{ id: 'technical', nameAr: 'الفريق التقني', nameEn: 'Technical Team' }],
  },
  {
    id: 'relations',
    nameAr: 'لجنة العلاقات',
    nameEn: 'Relations Committee',
    roles: [],
    teams: [
      { id: 'external-relations', nameAr: 'فريق العلاقات الخارجية', nameEn: 'External Relations Team' },
      { id: 'public-relations', nameAr: 'فريق العلاقات العامة', nameEn: 'Public Relations Team' },
    ],
  },
  {
    id: 'members-graduates',
    nameAr: 'لجنة شؤون الأعضاء والخريجين',
    nameEn: 'Members & Graduates Committee',
    roles: [],
    teams: [],
  },
  { id: 'activities', nameAr: 'لجنة الأنشطة', nameEn: 'Activities Committee', roles: [], teams: [] },
  { id: 'projects', nameAr: 'لجنة المشاريع', nameEn: 'Projects Committee', roles: [], teams: [] },
  { id: 'exhibition', nameAr: 'لجنة المعرض', nameEn: 'Exhibition Committee', roles: [], teams: [] },
]
