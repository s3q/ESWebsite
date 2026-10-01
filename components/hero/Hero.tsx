import type { CSSProperties } from 'react'
import { IconArrowRight } from '@/components/ui/icons'
import { HeroArt } from './HeroArt'
import styles from './Hero.module.css'

const order = (i: number) => ({ '--i': i }) as CSSProperties

/**
 * On desktop the hero is one viewport taller than its sticky stage: the copy holds still
 * while the sculpture assembles, then native scrolling carries the whole stage away as
 * Events arrives. No scroll interception, and the actions stay usable throughout.
 */
export function Hero() {
  return (
    <section id="top" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.stage}>
        <div className={`container ${styles.grid}`}>
          <div className={styles.copy}>
            <p className={`${styles.eyebrow} intro-item`} style={order(0)}>
              <span className={styles.eyebrowMark} aria-hidden="true" />
              Engineering Society · Sultan Qaboos University
            </p>
            <h1 id="hero-title" className={`${styles.title} intro-item`} style={order(1)}>
              <span className={styles.line}>Where ideas</span>{' '}
              <span className={styles.line}>
                take shape<span className={styles.stop}>.</span>
              </span>
            </h1>
            <p className={`${styles.lead} intro-item`} style={order(2)}>
              Meet the people, build the projects, and discover the experiences that move your engineering journey
              forward.
            </p>
            <div className={`${styles.actions} intro-item`} style={order(3)}>
              <a href="#events" className="btn btn--primary">
                Explore Events
                <IconArrowRight className="btn__arrow" />
              </a>
              <a href="#projects" className="btn btn--secondary">
                Discover Projects
              </a>
            </div>
          </div>
          <div className={styles.artColumn}>
            <HeroArt />
          </div>
        </div>
      </div>
    </section>
  )
}
