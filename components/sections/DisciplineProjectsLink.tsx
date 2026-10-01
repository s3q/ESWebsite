'use client'

import type { DisciplineId } from '@/content/disciplines'
import { IconArrowRight } from '@/components/ui/icons'
import { PROJECT_FILTER_EVENT } from '@/lib/events'

/**
 * Jumps to #projects with this discipline pre-selected. Without JavaScript it is still a
 * working anchor to the Projects section.
 */
export function DisciplineProjectsLink({
  discipline,
  name,
  className,
}: {
  discipline: DisciplineId
  name: string
  className?: string
}) {
  return (
    <a
      href="#projects"
      className={className}
      aria-label={`Sample projects in ${name}`}
      onClick={() => window.dispatchEvent(new CustomEvent(PROJECT_FILTER_EVENT, { detail: discipline }))}
    >
      Sample projects
      <IconArrowRight width={16} height={16} />
    </a>
  )
}
