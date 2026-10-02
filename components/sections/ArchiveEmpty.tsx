import Link from 'next/link'
import type { Activity } from '@/content/activities'
import { getI18n } from '@/lib/i18n/server'
import { IconArchive, IconArrowRight } from '@/components/ui/icons'
import styles from './Archive.module.css'

/** Shown while no editions have been documented: honest, and still useful for navigation. */
export async function ArchiveEmpty({ activities }: { activities: Activity[] }) {
  const { t, locale } = await getI18n()
  return (
    <div className={styles.empty}>
      <div className={styles.emptyMessage} data-reveal="stagger">
        <span className={styles.emptyIcon} aria-hidden="true">
          <IconArchive />
        </span>
        <h2 className={styles.emptyTitle}>{t.archive.emptyTitle}</h2>
        <p className={styles.emptyBody}>{t.archive.emptyBody}</p>
        <Link href="/#activities" className="btn btn--secondary">
          {t.archive.back}
          <IconArrowRight className="btn__arrow" />
        </Link>
      </div>
      <div className={styles.programmes}>
        <h2 className={styles.programmesTitle}>{t.archive.toBeArchived}</h2>
        <ul className={styles.programmeList} data-reveal="points">
          {activities.map((a) => (
            <li key={a.id} className={styles.programme}>
              <span className={styles.programmeRule} data-part="rule" aria-hidden="true" />
              <Link href={`/#activity-${a.id}`} className={styles.programmeLink} data-part="text">
                <span lang="ar" dir="rtl" className={styles.programmeAr}>
                  {a.nameAr}
                </span>
                {locale === 'en' && <span className={styles.programmeEn}>{a.nameEn}</span>}
                <IconArrowRight className={styles.linkArrow} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
