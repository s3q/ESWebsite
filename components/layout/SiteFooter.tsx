import Image from 'next/image'
import Link from 'next/link'
import { PAGE_LINKS, SECTION_LINKS, SITE, sectionHref } from '@/content/site'
import { ACTIVE_SOCIAL_ACCOUNTS } from '@/content/social'
import { SocialIcon } from '@/components/ui/SocialIcon'
import styles from './SiteFooter.module.css'

/** `onHome` keeps section links as same-page fragments on the homepage. */
export function SiteFooter({ onHome = true }: { onHome?: boolean }) {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.mast}>
          <div className={styles.identity}>
            {/* The emblem keeps its own colours; a quiet ivory disc gives it clear space on navy. */}
            <span className={styles.emblemField}>
              <Image src="/brand/es-emblem.webp" alt="" width={64} height={64} className={styles.emblem} />
            </span>
            <div>
              <p className={styles.name}>{SITE.name}</p>
              <p className={styles.tagline}>Discover events, share projects, preserve achievements.</p>
            </div>
          </div>
          <div className={styles.affiliation}>
            <p className={styles.label}>A student society at</p>
            {/* The wordmark keeps its original white field, colours and proportions. */}
            <div className={styles.wordmark}>
              <Image src="/brand/squ-wordmark.png" alt="Sultan Qaboos University" width={399} height={126} sizes="200px" />
            </div>
          </div>
        </div>

        {ACTIVE_SOCIAL_ACCOUNTS.length > 0 && (
          <section className={styles.follow} aria-labelledby="follow-title">
            <h2 id="follow-title" className={styles.followTitle}>
              Follow the Society
            </h2>
            <ul className={styles.socials}>
              {ACTIVE_SOCIAL_ACCOUNTS.map((account) => (
                <li key={account.platform}>
                  <a href={account.url} className={styles.social} target="_blank" rel="noopener noreferrer">
                    <SocialIcon platform={account.platform} className={styles.socialIcon} />
                    <span>{account.label}</span>
                    <span className="visually-hidden"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav aria-label="Footer" className={styles.nav}>
          <ul className={styles.links}>
            {SECTION_LINKS.map((link) => (
              <li key={link.id}>
                <a href={sectionHref(link.id, onHome)} className={styles.link}>
                  {link.label}
                </a>
              </li>
            ))}
            {PAGE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.link}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {SITE.contact.length > 0 && (
            <ul className={styles.links}>
              {SITE.contact.map((c) => (
                <li key={c.href}>
                  <a href={c.href} className={styles.link}>
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className={styles.base}>
          <p>
            © {year} {SITE.name}, {SITE.affiliation}.
          </p>
          <p>Preview site. Platform features arrive in phases.</p>
        </div>
      </div>
    </footer>
  )
}
