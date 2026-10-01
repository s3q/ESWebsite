import { PROJECTS } from '@/content/projects'
import { ProjectsBrowser } from './ProjectsBrowser'
import styles from './Projects.module.css'

export function Projects() {
  return (
    <section id="projects" className={`section ${styles.section}`} aria-labelledby="projects-title">
      <div className="container">
        <header className="section-head">
          <h2 id="projects-title" className="section-title" data-reveal="heading">
            Built by our community.
          </h2>
          <div className={styles.headAside} data-reveal="rise">
            <p className="section-lead">
              Projects and publications, kept with their discipline, year and team so each generation can build on
              the last instead of starting over.
            </p>
            <p className="preview-note">
              <span className="status-dot" aria-hidden="true" />
              <span>
                <strong>Sample entries.</strong> The archive opens in Phase 3; these examples show how finished work
                will be preserved.
              </span>
            </p>
          </div>
        </header>
        <ProjectsBrowser projects={PROJECTS} />
      </div>
    </section>
  )
}
