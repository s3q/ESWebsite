import { SITE, sectionHref } from '@/content/site'
import { IconArrowRight } from '@/components/ui/icons'
import { PreviewAction } from '@/components/ui/PreviewAction'
import styles from './JoinInvitation.module.css'

/** `onHome` keeps the events link a same-page fragment on the homepage. */
export function JoinInvitation({ onHome = true }: { onHome?: boolean }) {
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
          Make your next idea a shared one<span className={styles.stop}>.</span>
        </h2>
        <div className={styles.aside} data-reveal="rise">
          <p className={styles.body}>
            Membership starts with one permanent profile: your events, certificates and projects in one place,
            carried forward every year. Member registration is part of the platform’s first release.
          </p>
          <div className={styles.actions}>
            {SITE.membershipUrl ? (
              <a href={SITE.membershipUrl} className="btn btn--on-dark">
                Join the Society
                <IconArrowRight className="btn__arrow" />
              </a>
            ) : (
              <PreviewAction
                label="Join the Society"
                variant="on-dark"
                arrow
                title="Membership registration opens soon"
                next={{ href: eventsHref, label: 'Explore events' }}
              >
                <p>Registration isn’t open on this site yet, and nothing you do here is submitted.</p>
                <p>When it opens, you’ll:</p>
                <ul>
                  <li>create one profile with your name, university email, student ID, year and major;</li>
                  <li>receive a confirmation email with your platform login;</li>
                  <li>keep that same profile, and its history, every year after.</li>
                </ul>
              </PreviewAction>
            )}
            <a href={eventsHref} className="btn btn--outline-dark">
              Explore Events
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
