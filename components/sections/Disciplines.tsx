import { DISCIPLINES } from '@/content/disciplines'
import { PROJECTS } from '@/content/projects'
import { DisciplineSymbol } from '@/components/ui/DisciplineSymbol'
import { DisciplineProjectsLink } from './DisciplineProjectsLink'
import styles from './Disciplines.module.css'

export function Disciplines() {
  // An action appears only where it leads somewhere real: a discipline with archive entries.
  const withProjects = new Set(PROJECTS.map((p) => p.discipline))

  return (
    <section id="disciplines" className={`section ${styles.section}`} aria-labelledby="disciplines-title">
      <div className="container">
        <header className="section-head">
          <h2 id="disciplines-title" className="section-title" data-reveal="heading">
            Different disciplines. Shared ambition.
          </h2>
          <p className="section-lead" data-reveal="rise" style={{display:"none"}}>
            Seven engineering disciplines meet in one society: the same events, the same archive and the same
            network, whichever field you study.
          </p>
        </header>

        <ul className={styles.index} data-reveal="index">
          {DISCIPLINES.map((d) => (
            <li key={d.id} className={styles.row} data-symbol-row="">
              <span className={styles.rule} data-part="rule" aria-hidden="true" />
              <DisciplineSymbol id={d.id} className={styles.symbol} />
              <div className={styles.text} data-part="text">
                <h3 className={styles.name}>{d.name}</h3>
                <p className={styles.focus}>{d.focus}</p>
                <p className={styles.description}>{d.description}</p>
              </div>
              {withProjects.has(d.id) && (
                <DisciplineProjectsLink discipline={d.id} name={d.shortName} className={styles.action} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
