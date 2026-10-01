'use client'

import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Activity, ActivityEdition, ActivityId } from '@/content/activities'
import { IconArrowRight } from '@/components/ui/icons'
import { PhotoPlaceholder } from '@/components/ui/PhotoPlaceholder'
import styles from './Archive.module.css'

/**
 * Previous editions, filterable by programme and year. Filters are built only from values
 * present in the data, and live in the URL (?programme=&year=) so views can be shared.
 */
export function ArchiveBrowser({ editions, activities }: { editions: ActivityEdition[]; activities: Activity[] }) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const byId = new Map(activities.map((a) => [a.id, a]))
  const programmes = activities.filter((a) => editions.some((e) => e.activity === a.id))
  const years = [...new Set(editions.map((e) => e.year))].sort((a, b) => b - a)

  const programmeParam = params.get('programme')
  const programme = programmes.some((p) => p.id === programmeParam) ? (programmeParam as ActivityId) : null
  const yearParam = Number(params.get('year'))
  const year = years.includes(yearParam) ? yearParam : null

  const set = (key: 'programme' | 'year', value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const visible = editions
    .filter((e) => (!programme || e.activity === programme) && (!year || e.year === year))
    .sort((a, b) => b.year - a.year)

  return (
    <div className={styles.browser}>
      <div className={styles.filters}>
        <div className={styles.filterGroup} role="group" aria-label="Filter by programme">
          <Chip active={!programme} onClick={() => set('programme', null)}>
            All programmes
          </Chip>
          {programmes.map((p) => (
            <Chip key={p.id} active={programme === p.id} onClick={() => set('programme', p.id)} lang="ar">
              {p.nameAr}
            </Chip>
          ))}
        </div>
        <div className={styles.filterGroup} role="group" aria-label="Filter by year">
          <Chip active={!year} onClick={() => set('year', null)}>
            All years
          </Chip>
          {years.map((y) => (
            <Chip key={y} active={year === y} onClick={() => set('year', String(y))}>
              {String(y)}
            </Chip>
          ))}
        </div>
      </div>

      <p className="visually-hidden" aria-live="polite">
        Showing {visible.length} {visible.length === 1 ? 'edition' : 'editions'}
      </p>

      {visible.length > 0 ? (
        <ul className={styles.results}>
          {visible.map((edition) => {
            const activity = byId.get(edition.activity)
            return (
              <li key={edition.id} className={styles.edition}>
                <div className={styles.editionMedia}>
                  {edition.image ? (
                    <Image src={edition.image.src} alt={edition.image.alt} fill sizes="(min-width: 64rem) 30vw, 100vw" className={styles.photo} />
                  ) : (
                    <PhotoPlaceholder nameAr={activity?.nameAr ?? ''} ratio="4:3" />
                  )}
                </div>
                <p className={styles.editionProgramme} lang="ar" dir="rtl">
                  {activity?.nameAr}
                </p>
                <h2 className={styles.editionTitle}>{edition.title}</h2>
                <p className={styles.editionYear}>{edition.year}</p>
                {edition.summary && <p className={styles.editionSummary}>{edition.summary}</p>}
                {edition.href && (
                  <a href={edition.href} className={styles.editionLink}>
                    View this edition
                    <IconArrowRight className={styles.linkArrow} />
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className={styles.noMatch}>No editions match these filters.</p>
      )}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
  lang,
}: {
  active: boolean
  onClick: () => void
  children: string
  lang?: string
}) {
  return (
    <button
      type="button"
      className={styles.chip}
      aria-pressed={active}
      onClick={onClick}
      lang={lang}
      dir={lang === 'ar' ? 'rtl' : undefined}
    >
      {children}
    </button>
  )
}
