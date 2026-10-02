import { COMMITTEES, LEADERSHIP, SENIOR_LEADERSHIP, type Committee } from '@/content/structure'
import type { I18n } from '@/lib/i18n'
import { getI18n } from '@/lib/i18n/server'
import { LeadershipTree } from './LeadershipTree'
import styles from './Structure.module.css'

/**
 * The society's full organisation, rendered from content/structure.ts: senior leadership
 * above, committees and their teams beneath. Semantic nested lists with selectable text; the
 * connector lines are decoration. The English page pairs each Arabic name with its English
 * working label; the Arabic page shows the society's own names alone.
 */
export async function Structure() {
  const i18n = await getI18n()
  const { t, l, locale } = i18n
  const vacant = [LEADERSHIP.president, ...LEADERSHIP.vicePresidents].every((p) => !p.holder)
  const rolesMissing = COMMITTEES.every((c) => c.roles.length === 0)

  return (
    <section id="structure" className={`section ${styles.section}`} aria-labelledby="structure-title">
      <div className="container">
        <header className="section-head">
          <h2 id="structure-title" className="section-title" data-reveal="heading">
            {t.structure.title}
          </h2>
          <div className={styles.headAside} data-reveal="rise">
            <p className="section-lead">{t.structure.lead}</p>
            {(vacant || rolesMissing) && (
              <p className="preview-note">
                <span className="status-dot" aria-hidden="true" />
                <span>
                  <strong>{t.structure.rosterStrong}</strong> {t.structure.rosterBody}
                </span>
              </p>
            )}
          </div>
        </header>

        <div className={styles.tier}>
          <h3 className={styles.tierTitle} data-reveal="rise">
            {l(SENIOR_LEADERSHIP)}
            {locale === 'en' && (
              <span lang="ar" dir="rtl" className={styles.tierAr}>
                {SENIOR_LEADERSHIP.ar}
              </span>
            )}
          </h3>
          <LeadershipTree bilingual />
        </div>

        <div className={styles.chart} data-reveal="chart">
          <span className={styles.trunk} data-part="trunk" aria-hidden="true" />
          <h3 id="committees-title" className={styles.chartTitle} data-part="node">
            {t.structure.committees}
          </h3>
          <span className={`${styles.trunk} ${styles.trunkLower}`} data-part="trunk" aria-hidden="true" />
          <span className={styles.bus} data-part="bus" aria-hidden="true" />
          <ul className={styles.committees} aria-labelledby="committees-title">
            {COMMITTEES.map((committee) => (
              <CommitteeNode key={committee.id} committee={committee} i18n={i18n} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function CommitteeNode({ committee, i18n }: { committee: Committee; i18n: I18n }) {
  const { t, l, locale } = i18n
  const gloss = locale === 'en'
  return (
    <li className={styles.committee}>
      <span className={styles.spine} data-part="spine" aria-hidden="true" />
      <span className={styles.tick} data-part="tick" aria-hidden="true" />
      <div className={styles.node} data-part="node">
        <h4 className={styles.name} lang="ar" dir="rtl">
          {committee.name.ar}
        </h4>
        {gloss && <p className={styles.gloss}>{committee.name.en}</p>}
        {committee.roles.length > 0 && (
          <ul className={styles.roles}>
            {committee.roles.map((role, i) => (
              <li key={`${role.title.en}-${i}`}>
                <span className={styles.roleTitle}>{l(role.title)}</span>
                <span>{role.holder ? l(role.holder.name) : t.common.toBeAnnounced}</span>
              </li>
            ))}
          </ul>
        )}
        {committee.teams.length > 0 && (
          <ul className={styles.teams} aria-label={t.structure.teamsIn(l(committee.name))}>
            {committee.teams.map((team) => (
              <li key={team.id} className={styles.team}>
                <span lang="ar" dir="rtl" className={styles.teamAr}>
                  {team.name.ar}
                </span>
                {gloss && <span className={styles.teamEn}>{team.name.en}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
