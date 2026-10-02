import { IconCamera } from './icons'
import styles from './PhotoPlaceholder.module.css'

/**
 * A clearly identified stand-in for an authentic society photograph. It holds the final
 * proportions so layouts don't shift when the real photo arrives, and never pretends to be a
 * photograph of real participants. Decorative, so hidden from assistive tech.
 *
 * Two layers, so motion can move the "picture" while its labelling stays put:
 *   <PlaceholderArt>   the grid and the programme's name, which may parallax or scale
 *   <PlaceholderFrame> the registration marks and "Photograph to come" tag, fixed to the frame
 * <PhotoPlaceholder> combines both for static use.
 */
export function PlaceholderArt({ nameAr }: { nameAr: string }) {
  return (
    <div className={styles.art} aria-hidden="true">
      <span className={styles.watermark} lang="ar" dir="rtl">
        {nameAr}
      </span>
    </div>
  )
}

export function PlaceholderFrame({ label, ratio }: { label: string; ratio: string }) {
  return (
    <div className={styles.frame} aria-hidden="true">
      <span className={styles.crop}>
        <span />
        <span />
        <span />
      </span>
      <span className={styles.tag}>
        <IconCamera className={styles.icon} />
        {label} · <span dir="ltr">{ratio}</span>
      </span>
    </div>
  )
}

export function PhotoPlaceholder({ nameAr, label, ratio }: { nameAr: string; label: string; ratio: string }) {
  return (
    <div className={styles.placeholder}>
      <PlaceholderArt nameAr={nameAr} />
      <PlaceholderFrame label={label} ratio={ratio} />
    </div>
  )
}
