import { SITE, sectionHref } from '@/content/site'
import { getI18n } from '@/lib/i18n/server'
import { IconArrowRight } from '@/components/ui/icons'
import { PreviewAction } from '@/components/ui/PreviewAction'
import styles from './JoinInvitation.module.css'

/** `onHome` keeps the events link a same-page fragment on the homepage. */
export async function JoinInvitation({ onHome = true }: { onHome?: boolean }) {
  const { t } = await getI18n()
  const eventsHref = sectionHref('events', onHome)
  return (
    <section id="join" className={styles.join} aria-labelledby="join-title">
      {/* The logo's four quadrant colours as a key: the page's closing signature. */}
      <div className={styles.key} aria-hidden="true" data-reveal="key">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className={`container ${styles.inner}`}>
        <h2 id="join-title" className={styles.title} data-reveal="heading">
          {t.join.title}
          <span className={styles.stop}>.</span>
        </h2>
        <div className={styles.aside} data-reveal="rise">
          <p className={styles.body}>{t.join.body}</p>
          <div className={styles.actions}>
            {SITE.membershipUrl ? (
              <a href={SITE.membershipUrl} className="btn btn--on-dark">
                {t.join.join}
                <IconArrowRight className="btn__arrow" />
              </a>
            ) : (
              <PreviewAction
                label={t.join.join}
                variant="on-dark"
                arrow
                title={t.join.dialogTitle}
                next={{ href: eventsHref, label: t.join.dialogNext }}
              >
                <p>{t.join.dialogIntro}</p>
                <p>{t.join.dialogWhenOpen}</p>
                <ul>
                  {t.join.dialogSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </PreviewAction>
            )}
            <a href={eventsHref} className="btn btn--outline-dark">
              {t.join.exploreEvents}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
