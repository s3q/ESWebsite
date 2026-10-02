import Link from 'next/link'
import { OVERVIEW } from '@/content/overview'
import { IconArrowRight } from '@/components/ui/icons'
import { getI18n } from '@/lib/i18n/server'
import { OverviewBackdrop } from './OverviewBackdrop'
import styles from './Overview.module.css'

/** The society in brief, set over its own photograph. On the homepage it links on to About. */
export async function Overview({ aboutLink = true }: { aboutLink?: boolean }) {
  const { t, l } = await getI18n()
  const { backdrop } = OVERVIEW
  return (
    <section id="overview" className={styles.overview} aria-labelledby="overview-title">
      <OverviewBackdrop src={backdrop.src} />
      <div className={`container ${styles.inner}`}>
        <div className={styles.text}>
          <h2 id="overview-title" className={styles.title} data-reveal="heading">
            {l(OVERVIEW.heading)}
          </h2>
          <div className={styles.copy} data-reveal="stagger">
            {OVERVIEW.paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? styles.lead : styles.body}>
                {l(p)}
              </p>
            ))}
            {aboutLink && (
              <Link href="/about" className={styles.more}>
                {t.overview.more}
                <IconArrowRight className={styles.moreArrow} />
              </Link>
            )}
          </div>
        </div>
        <ul className={styles.points} data-reveal="points">
          {OVERVIEW.points.map((point) => (
            <li key={point.id} className={styles.point}>
              <span className={styles.pointRule} data-part="rule" aria-hidden="true" />
              <h3 className={styles.pointTitle} data-part="text">
                {l(point.title)}
              </h3>
              <p className={styles.pointBody} data-part="text">
                {l(point.body)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
