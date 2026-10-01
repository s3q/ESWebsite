'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DISCIPLINE_BY_ID, type DisciplineId } from '@/content/disciplines'
import type { ArchiveProject } from '@/content/projects'
import { IconArchive, IconArrowRight } from '@/components/ui/icons'
import { ItemMedia } from '@/components/ui/Plate'
import { PROJECT_FILTER_EVENT } from '@/lib/events'
import { DESKTOP_QUERY, FINE_POINTER_QUERY, MOTION } from '@/lib/motion'
import styles from './Projects.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Filter = DisciplineId | 'all'

export function ProjectsBrowser({ projects }: { projects: ArchiveProject[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const rootRef = useRef<HTMLDivElement>(null)
  // Reveals are for arrival; once someone has filtered, results simply crossfade in place.
  const hasFiltered = useRef(false)
  const choose = (next: Filter) => {
    hasFiltered.current = true
    setFilter(next)
  }

  // Discipline rows elsewhere on the page can pre-select a filter.
  useEffect(() => {
    const onFilter = (e: Event) => {
      const id = (e as CustomEvent<DisciplineId>).detail
      if (id && id in DISCIPLINE_BY_ID) {
        hasFiltered.current = true
        setFilter(id)
      }
    }
    window.addEventListener(PROJECT_FILTER_EVENT, onFilter)
    return () => window.removeEventListener(PROJECT_FILTER_EVENT, onFilter)
  }, [])

  const counts = useMemo(() => {
    const map = new Map<DisciplineId, number>()
    projects.forEach((p) => map.set(p.discipline, (map.get(p.discipline) ?? 0) + 1))
    return map
  }, [projects])
  const disciplines = [...counts.keys()]

  const visible = filter === 'all' ? projects : projects.filter((p) => p.discipline === filter)
  const [featured, ...others] = visible
  const supporting = others.slice(0, 2)
  const more = others.slice(2)

  const summary =
    filter === 'all'
      ? `Showing all ${visible.length} sample projects`
      : `Showing ${visible.length} sample ${visible.length === 1 ? 'project' : 'projects'} in ${DISCIPLINE_BY_ID[filter].name}`

  // Portfolio motion: a mask reveal on first arrival, gentle parallax in the drawings, and a
  // restrained tilt on fine-pointer desktops. Each lives on its own element.
  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (!hasFiltered.current) {
          const threshold = window.innerHeight * 0.85
          gsap.utils.toArray<HTMLElement>('[data-mask]', root).forEach((el) => {
            if (el.getBoundingClientRect().top < threshold) return
            gsap.fromTo(
              el,
              { clipPath: 'inset(0% 0% 100% 0%)' },
              {
                clipPath: 'inset(0% 0% 0% 0%)',
                duration: MOTION.mask.duration,
                ease: MOTION.ease,
                clearProps: 'clipPath',
                scrollTrigger: { trigger: el, start: MOTION.start, once: true },
              },
            )
          })
        }
      })

      mm.add(`${DESKTOP_QUERY} and (prefers-reduced-motion: no-preference)`, () => {
        gsap.utils.toArray<HTMLElement>('[data-mask]', root).forEach((media) => {
          const art = media.querySelector('[data-parallax]')
          if (!art) return
          gsap.fromTo(
            art,
            { y: -MOTION.parallax },
            {
              y: MOTION.parallax,
              ease: 'none',
              scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        })
      })

      mm.add(`${DESKTOP_QUERY} and ${FINE_POINTER_QUERY} and (prefers-reduced-motion: no-preference)`, () => {
        const cleanups: (() => void)[] = []
        gsap.utils.toArray<HTMLElement>('[data-tilt]', root).forEach((el) => {
          gsap.set(el, { transformPerspective: 900 })
          const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: MOTION.ease })
          const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: MOTION.ease })
          const onMove = (e: PointerEvent) => {
            const r = el.getBoundingClientRect()
            const nx = (e.clientX - r.left) / r.width - 0.5
            const ny = (e.clientY - r.top) / r.height - 0.5
            ry(nx * MOTION.tiltMax * 2)
            rx(-ny * MOTION.tiltMax * 2)
          }
          const onLeave = () => {
            rx(0)
            ry(0)
          }
          el.addEventListener('pointermove', onMove)
          el.addEventListener('pointerleave', onLeave)
          cleanups.push(() => {
            el.removeEventListener('pointermove', onMove)
            el.removeEventListener('pointerleave', onLeave)
            gsap.set(el, { clearProps: 'transform' })
          })
        })
        return () => cleanups.forEach((fn) => fn())
      })

      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [filter], revertOnUpdate: true },
  )

  return (
    <div ref={rootRef} className={styles.browser}>
      <div className={styles.filters} role="group" aria-label="Filter projects by discipline">
        <FilterButton active={filter === 'all'} count={projects.length} onClick={() => choose('all')}>
          All
        </FilterButton>
        {disciplines.map((id) => (
          <FilterButton key={id} active={filter === id} count={counts.get(id) ?? 0} onClick={() => choose(id)}>
            {DISCIPLINE_BY_ID[id].shortName}
          </FilterButton>
        ))}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {summary}
      </p>

      <div key={filter} className={styles.results}>
        {featured && <FeaturedProject project={featured} />}

        {supporting.length > 0 && (
          <ul className={styles.supporting}>
            {supporting.map((p) => (
              <li key={p.id}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        )}

        {more.length > 0 && (
          <div className={styles.more}>
            <h3 className={styles.moreTitle}>Also in the archive</h3>
            <ul className={styles.moreList}>
              {more.map((p) => (
                <li key={p.id} className={styles.moreRow}>
                  <span className={styles.moreName}>{p.title}</span>
                  <span className={styles.moreMeta}>
                    {DISCIPLINE_BY_ID[p.discipline].shortName} · {p.year} · Sample
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {filter !== 'all' && visible.length === 1 && (
          <p className={styles.note}>This is the only sample project in this discipline.</p>
        )}
      </div>
    </div>
  )
}

function FilterButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean
  count: number
  onClick: () => void
  children: string
}) {
  return (
    <button type="button" className={styles.filter} aria-pressed={active} onClick={onClick}>
      {children}
      <span className={styles.count} aria-hidden="true">
        {count}
      </span>
    </button>
  )
}

/** The title links to the archive entry once one exists; the whole card becomes its target. */
function ProjectTitle({ project, className }: { project: ArchiveProject; className: string }) {
  return (
    <h3 id={`${project.id}-title`} className={className}>
      {project.href ? (
        <a href={project.href} className={styles.stretched}>
          {project.title}
          <IconArrowRight className={styles.titleArrow} />
        </a>
      ) : (
        project.title
      )}
    </h3>
  )
}

function ArchiveStatus({ project }: { project: ArchiveProject }) {
  if (project.href) return null
  return (
    <p className={styles.archiveStatus}>
      <IconArchive className={styles.archiveIcon} />
      Full archive entry opens in Phase 3
    </p>
  )
}

function Media({ project, sizes, tone }: { project: ArchiveProject; sizes: string; tone: 'soft' | 'brand' }) {
  return (
    <div className={styles.tilt} data-tilt="">
      <div className={styles.media} data-mask="">
        <ItemMedia
          id={project.id}
          drawing={project.drawing}
          image={project.image}
          tone={tone}
          sizes={sizes}
          className={styles.plate}
        />
        {project.sample && <span className={`chip chip--sample ${styles.sampleTag}`}>Sample</span>}
      </div>
    </div>
  )
}

function FeaturedProject({ project }: { project: ArchiveProject }) {
  const discipline = DISCIPLINE_BY_ID[project.discipline]
  return (
    <article className={styles.featured} aria-labelledby={`${project.id}-title`}>
      <Media project={project} tone="brand" sizes="(min-width: 64rem) 60vw, 100vw" />
      <div className={styles.featuredBody}>
        <p className={styles.kicker}>{discipline.name}</p>
        <ProjectTitle project={project} className={styles.featuredTitle} />
        <p className={styles.summary}>{project.summary}</p>
        <dl className={styles.spec}>
          <div>
            <dt>Discipline</dt>
            <dd>{discipline.shortName}</dd>
          </div>
          <div>
            <dt>Year</dt>
            <dd>{project.year}</dd>
          </div>
          <div>
            <dt>Team</dt>
            <dd>{project.team}</dd>
          </div>
        </dl>
        <ArchiveStatus project={project} />
      </div>
    </article>
  )
}

function ProjectCard({ project }: { project: ArchiveProject }) {
  const discipline = DISCIPLINE_BY_ID[project.discipline]
  return (
    <article className={styles.card} aria-labelledby={`${project.id}-title`}>
      <Media project={project} tone="soft" sizes="(min-width: 48rem) 40vw, 100vw" />
      <div className={styles.cardBody}>
        <p className={styles.cardMeta}>
          {discipline.shortName} <span aria-hidden="true">·</span> {project.year}
        </p>
        <ProjectTitle project={project} className={styles.cardTitle} />
        <p className={styles.summary}>{project.summary}</p>
        <p className={styles.team}>{project.team}</p>
      </div>
    </article>
  )
}
