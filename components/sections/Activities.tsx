import Link from 'next/link'
import { ACTIVITIES } from '@/content/activities'
import { IconArrowRight } from '@/components/ui/icons'
import { getI18n } from '@/lib/i18n/server'
import { ActivitiesShowcase } from './ActivitiesShowcase'
import styles from './Activities.module.css'

/** The society's recurring programmes. Dated events stay in the Events section. */
export async function Activities() {
  const { t } = await getI18n()
  const hasPhotos = ACTIVITIES.some((a) => a.photos.main)
  const hasFigures = ACTIVITIES.some((a) => a.stats.length > 0)

  return (
    <section id="activities" className={`section ${styles.section}`} aria-labelledby="activities-title">
      <div className="container">
        <header className="section-head">
          <h2 id="activities-title" className="section-title" data-reveal="heading">
            {t.activities.title}
          </h2>
          <div className={styles.headAside} data-reveal="rise">
            <p className="section-lead">{t.activities.lead}</p>
            {(!hasPhotos || !hasFigures) && (
              <p className="preview-note">
                <span className="status-dot" aria-hidden="true" />
                <span>
                  <strong>{hasPhotos ? t.activities.figuresStrong : t.activities.photosStrong}</strong>{' '}
                  {hasPhotos ? t.activities.figuresBody : t.activities.photosBody}
                </span>
              </p>
            )}
          </div>
        </header>

        <ActivitiesShowcase activities={ACTIVITIES} />

        <div className={styles.cta} data-reveal="rise">
          <Link href="/activities" className="btn btn--primary">
            {t.activities.explorePrevious}
            <IconArrowRight className="btn__arrow" />
          </Link>
        </div>
      </div>
    </section>
  )
}
