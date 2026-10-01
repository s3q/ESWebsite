import { COMMITTEES, LEADERSHIP, SENIOR_LEADERSHIP, type Committee } from '@/content/structure'
import { LeadershipTree } from './LeadershipTree'
import styles from './Structure.module.css'

/**
 * The society's full organisation, rendered from content/structure.ts: senior leadership
 * above, committees and their teams beneath. Semantic nested lists with selectable text; the
 * connector lines are decoration.
 */
export function Structure() {
  const vacant = [LEADERSHIP.president, ...LEADERSHIP.vicePresidents].every((p) => !p.holder)
  const rolesMissing = COMMITTEES.every((c) => c.roles.length === 0)

  return (
    <section id="structure" className={`section ${styles.section}`} aria-labelledby="structure-title">
      <div className="container">
        <header className="section-head">
          <h2 id="structure-title" className="section-title" data-reveal="heading">
            How the society is organised
          </h2>
          <div className={styles.headAside} data-reveal="rise">
            <p className="section-lead">
              Senior leadership sets the direction; committees and their teams carry the society’s work.
            </p>
            {(vacant || rolesMissing) && (
              <p className="preview-note">
                <span className="status-dot" aria-hidden="true" />
                <span>
                  <strong>Roster to be announced.</strong> Names, portraits, committee chairs and deputies will be added
                  once the society confirms its current roster.
                </span>
              </p>
            )}
          </div>
        </header>

        <div className={styles.tier}>
          <h3 className={styles.tierTitle} data-reveal="rise">
            {SENIOR_LEADERSHIP.nameEn}
            <span lang="ar" dir="rtl" className={styles.tierAr}>
              {SENIOR_LEADERSHIP.nameAr}
            </span>
          </h3>
          <LeadershipTree bilingual />
        </div>

        <div className={styles.chart} data-reveal="chart">
          <span className={styles.trunk} data-part="trunk" aria-hidden="true" />
          <h3 id="committees-title" className={styles.chartTitle} data-part="node">
            Committees
          </h3>
          <span className={`${styles.trunk} ${styles.trunkLower}`} data-part="trunk" aria-hidden="true" />
          <span className={styles.bus} data-part="bus" aria-hidden="true" />
          <ul className={styles.committees} aria-labelledby="committees-title">
            {COMMITTEES.map((committee) => (
              <CommitteeNode key={committee.id} committee={committee} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function CommitteeNode({ committee }: { committee: Committee }) {
  return (
    <li className={styles.committee}>
      <span className={styles.spine} data-part="spine" aria-hidden="true" />
      <span className={styles.tick} data-part="tick" aria-hidden="true" />
      <div className={styles.node} data-part="node">
        <h4 className={styles.name} lang="ar" dir="rtl">
          {committee.nameAr}
        </h4>
        <p className={styles.gloss}>{committee.nameEn}</p>

        {committee.roles.length > 0 && (
          <ul className={styles.roles}>
            {committee.roles.map((role, i) => (
              <li key={`${role.titleEn}-${i}`}>
                <span className={styles.roleTitle}>{role.titleEn}</span>
                <span>{role.holder?.name ?? 'To be announced'}</span>
              </li>
            ))}
          </ul>
        )}

        {committee.teams.length > 0 && (
          <ul className={styles.teams} aria-label={`Teams in the ${committee.nameEn}`}>
            {committee.teams.map((team) => (
              <li key={team.id} className={styles.team}>
                <span lang="ar" dir="rtl" className={styles.teamAr}>
                  {team.nameAr}
                </span>
                <span className={styles.teamEn}>{team.nameEn}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
