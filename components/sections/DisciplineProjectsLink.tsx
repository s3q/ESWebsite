'use client'

import type { DisciplineId } from '@/content/disciplines'
import { useI18n } from '@/components/i18n/I18nProvider'
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
  const { t } = useI18n()
  return (
    <a
      href="#projects"
      className={className}
      aria-label={t.disciplines.sampleProjectsIn(name)}
      onClick={() => window.dispatchEvent(new CustomEvent(PROJECT_FILTER_EVENT, { detail: discipline }))}
    >
      {t.disciplines.sampleProjects}
      <IconArrowRight width={16} height={16} />
    </a>
  )
}
