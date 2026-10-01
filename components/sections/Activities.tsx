import Link from 'next/link'
import { ACTIVITIES } from '@/content/activities'
import { IconArrowRight } from '@/components/ui/icons'
import { ActivitiesShowcase } from './ActivitiesShowcase'
import styles from './Activities.module.css'

/** The society's recurring programmes. Dated events stay in the Events section. */
export function Activities() {
  const hasPhotos = ACTIVITIES.some((a) => a.photos.main)
  const hasFigures = ACTIVITIES.some((a) => a.stats.length > 0)

  return (
    <section id="activities" className={`section ${styles.section}`} aria-labelledby="activities-title">
      <div className="container">
        <header className="section-head">
          <h2 id="activities-title" className="section-title" data-reveal="heading">
            Engineering Society Activities
          </h2>
          <div className={styles.headAside} data-reveal="rise">
            <p className="section-lead">
              Explore the programmes, gatherings, and experiences that bring our community together.
            </p>
            {(!hasPhotos || !hasFigures) && (
              <p className="preview-note">
                <span className="status-dot" aria-hidden="true" />
                <span>
                  <strong>Photographs and figures to come.</strong> They’ll appear with each programme once the
                  society supplies and confirms them.
                </span>
              </p>
            )}
          </div>
        </header>

        <ActivitiesShowcase activities={ACTIVITIES} />

        <div className={styles.cta} data-reveal="rise">
          <Link href="/activities" className="btn btn--primary">
            Explore Previous Activities
            <IconArrowRight className="btn__arrow" />
          </Link>
        </div>
      </div>
    </section>
  )
}
