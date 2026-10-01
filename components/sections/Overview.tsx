import Link from 'next/link'
import { OVERVIEW } from '@/content/overview'
import { IconArrowRight } from '@/components/ui/icons'
import styles from './Overview.module.css'

/** The society in brief. On the homepage it links on to the About page. */
export function Overview({ aboutLink = true }: { aboutLink?: boolean }) {
  return (
    <section id="overview" className={`section ${styles.overview}`} aria-labelledby="overview-title">
      <div className={`container ${styles.grid}`}>
        <h2 id="overview-title" className={styles.title} data-reveal="heading">
          {OVERVIEW.heading}
        </h2>
        <div className={styles.copy} data-reveal="stagger">
          {OVERVIEW.paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? styles.lead : styles.body}>
              {p}
            </p>
          ))}
          {aboutLink && (
            <Link href="/about" className={styles.more}>
              More about the society
              <IconArrowRight className={styles.moreArrow} />
            </Link>
          )}
        </div>
        <ul className={styles.points} data-reveal="points">
          {OVERVIEW.points.map((point) => (
            <li key={point.title} className={styles.point}>
              <span className={styles.pointRule} data-part="rule" aria-hidden="true" />
              <h3 className={styles.pointTitle} data-part="text">
                {point.title}
              </h3>
              <p className={styles.pointBody} data-part="text">
                {point.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
