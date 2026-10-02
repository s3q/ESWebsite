import Link from 'next/link'
import { LEADERSHIP } from '@/content/structure'
import { IconArrowRight } from '@/components/ui/icons'
import { LeadershipTree } from './LeadershipTree'
import styles from './Leadership.module.css'

export function Leadership() {
  const positions = [LEADERSHIP.president, ...LEADERSHIP.vicePresidents]
  const allVacant = positions.every((p) => !p.holder)

  return (
    <section id="leadership" className={`section ${styles.section}`} aria-labelledby="leadership-title">
      <div className="container">
        <header className={styles.head}>
          {LEADERSHIP.term && (
            <p className={styles.term} data-reveal="rise">
              {LEADERSHIP.term}
            </p>
          )}
          <h2 id="leadership-title" className="section-title" data-reveal="heading">
            Meet the Society’s Leadership
          </h2>
          <p className={`section-lead ${styles.lead}`} data-reveal="rise">
          </p>
          {allVacant && (
            <p className={`preview-note ${styles.note}`} data-reveal="rise">
              <span className="status-dot" aria-hidden="true" />
              <span>
                <strong>Roster to be announced.</strong> Names, portraits and the current term will appear here once
                the society confirms them.
              </span>
            </p>
          )}
        </header>

        <LeadershipTree />

        <div className={styles.cta} data-reveal="rise">
          <Link href="/about#structure" className="btn btn--secondary">
            View the Full Society Structure
            <IconArrowRight className="btn__arrow" />
          </Link>
        </div>
      </div>
    </section>
  )
}
