import type { CSSProperties, ReactNode } from 'react'
import styles from './PageIntro.module.css'

const order = (i: number) => ({ '--i': i }) as CSSProperties

/** The opening of an inner page: same eyebrow, type scale and intro motion as the hero. */
export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className={styles.intro}>
      <div className="container">
        <p className={`${styles.eyebrow} intro-item`} style={order(0)}>
          <span className={styles.mark} aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className={`${styles.title} intro-item`} style={order(1)}>
          {title}
        </h1>
        {children && (
          <div className={`${styles.lead} intro-item`} style={order(2)}>
            {children}
          </div>
        )}
      </div>
    </header>
  )
}
