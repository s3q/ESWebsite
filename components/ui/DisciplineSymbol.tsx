import type { DisciplineId } from '@/content/disciplines'
import styles from './DisciplineSymbol.module.css'

/**
 * Discipline symbols in the hero's visual language: each sits in the same leaf-shaped tile as
 * the sculpture's modules (sharp corner towards the centre, here bottom-left), drawn on one
 * 48-unit grid with one stroke weight. The four logo disciplines reuse the logo's symbols;
 * the other three are drawn to match. One small detail (`.detail`) moves when its row is
 * hovered or focused.
 */

const TILE = 'M4 44V24A20 20 0 1 1 24 44Z'

/** The same trapezoid-tooth gear as the hero sculpture's mechanical module. */
function gearPath(cx: number, cy: number, outer: number, root: number, teeth: number) {
  const step = (Math.PI * 2) / teeth
  let d = ''
  for (let i = 0; i < teeth; i++) {
    const c = i * step
    const pts: [number, number][] = [
      [root, c - step * 0.32],
      [outer, c - step * 0.2],
      [outer, c + step * 0.2],
      [root, c + step * 0.32],
    ]
    for (const [r, a] of pts) {
      d += `${d ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`
    }
  }
  return `${d}Z`
}

const GEAR = gearPath(24, 24, 11.5, 9.6, 14)

const SYMBOLS: Record<DisciplineId, React.ReactNode> = {
  // Logo: mechanical wheel. Detail: the gear turns.
  mechanical: (
    <g className={`${styles.detail} ${styles.turn}`}>
      <path d={GEAR} />
      <circle cx="24" cy="24" r="1.3" />
      <path d="M24 22.7V15.5M25.1 24.7l6.3 3.6M22.9 24.7l-6.3 3.6" />
    </g>
  ),
  // Logo: circuit traces. Detail: the end pad takes the signal.
  electrical: (
    <>
      <path d="M16.6 17h5.4l4.5 4.5h6.6M16.6 25h2.4l4.5 4.5h7.6" />
      <circle cx="14.8" cy="17" r="1.8" />
      <circle cx="14.8" cy="25" r="1.8" />
      <circle cx="33.9" cy="21.5" r="1.3" />
      <circle cx="32.4" cy="29.5" r="1.9" className={`${styles.detail} ${styles.pad}`} />
    </>
  ),
  // Logo: architectural span. Detail: a carriage appears and crosses the span.
  civil: (
    <>
      <path d="M13 21.5h22M15 17.5h18M18 17.5v4M24 17.5v4M30 17.5v4" />
      <path d="M13 35V25h22v10M17 35v-4.2a3 3 0 0 1 6 0V35M25 35v-4.2a3 3 0 0 1 6 0V35" />
      <rect x="14.2" y="13.2" width="4.4" height="3" rx="1" className={`${styles.detail} ${styles.cross}`} />
    </>
  ),
  // Logo: oil derrick. Detail: the flame lifts.
  petroleum: (
    <>
      <path d="M19 36l3.4-20M29 36l-3.4-20M16 36h16M21.2 23h5.6M20 30h8M21.2 23l6.8 7M26.8 23l-6.8 7M22.4 16h3.2" />
      <path d="M24 9.6c1.4 1.6 1.6 3.4 0 5.4-1.6-2-1.4-3.8 0-5.4z" className={`${styles.detail} ${styles.flame}`} />
    </>
  ),
  // Flask. Detail: a bubble rises.
  chemical: (
    <>
      <path d="M20.5 12.5h7M21.8 12.5v7.6l-6.6 11.2a2.2 2.2 0 0 0 1.9 3.3h13.8a2.2 2.2 0 0 0 1.9-3.3l-6.6-11.2v-7.6" />
      <path d="M17.6 28h12.8" />
      <circle cx="23" cy="31" r="1.4" className={`${styles.detail} ${styles.bubble}`} />
    </>
  ),
  // Robot arm. Detail: the forearm swings about the elbow.
  mechatronics: (
    <>
      <path d="M14.5 36h11M20 36v-2.4" />
      <circle cx="20" cy="31.4" r="2.2" />
      <path d="M21 29.4l3.4-7.8" />
      <circle cx="25" cy="19.8" r="2.2" />
      <g className={`${styles.detail} ${styles.swing}`}>
        <path d="M27.1 20.6l6 2.6M33.1 23.2l2.6-1.6M33.1 23.2l1 2.6" />
      </g>
    </>
  ),
  // Conveyor. Detail: the parcel slides along the belt.
  industrial: (
    <>
      <rect x="12" y="28" width="24" height="6" rx="3" />
      <circle cx="15.2" cy="31" r="1.1" />
      <circle cx="32.8" cy="31" r="1.1" />
      <path d="M16.5 34v3M31.5 34v3" />
      <rect x="15.5" y="21" width="6" height="6" rx="1" className={`${styles.detail} ${styles.slide}`} />
      <rect x="25" y="22.4" width="4.6" height="4.6" rx="0.9" />
    </>
  ),
}

export function DisciplineSymbol({ id, className }: { id: DisciplineId; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={[styles.symbol, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      focusable="false"
    >
      <path d={TILE} className={styles.tile} />
      <g className={styles.art}>{SYMBOLS[id]}</g>
    </svg>
  )
}
