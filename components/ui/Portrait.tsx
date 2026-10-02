import Image from 'next/image'
import type { Person } from '@/content/structure'
import styles from './Portrait.module.css'

type Size = 'lg' | 'md' | 'sm'

const PIXELS: Record<Size, number> = { lg: 176, md: 140, sm: 96 }

/**
 * A portrait in the society's leaf frame — a circle with one square corner, the same form as
 * the hero modules and discipline tiles. Photos share one crop (head and shoulders, focus
 * adjustable per person). A vacant seat shows a quiet line drawing, never a stock face.
 */
export function Portrait({
  person,
  alt = '',
  size = 'md',
  className,
}: {
  person: Person | null
  /** The portrait's description, in the page's language. */
  alt?: string
  size?: Size
  className?: string
}) {
  const px = PIXELS[size]
  return (
    <span className={[styles.portrait, className].filter(Boolean).join(' ')} data-size={size} data-vacant={!person?.portrait || undefined}>
      <span className={styles.frame}>
        {person?.portrait ? (
          <Image
            src={person.portrait.src}
            alt={alt}
            fill
            sizes={`${px}px`}
            className={styles.photo}
            style={{ objectPosition: person.portraitFocus ?? '50% 28%' }}
          />
        ) : (
          <svg className={styles.vacant} viewBox="0 0 96 96" aria-hidden="true" focusable="false">
            <circle cx="48" cy="38" r="15" />
            <path d="M20 86c3.5-16 14.5-25 28-25s24.5 9 28 25" />
          </svg>
        )}
      </span>
      <span className={styles.spark} aria-hidden="true" />
    </span>
  )
}
