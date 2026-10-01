import type { DisciplineId } from './disciplines'
import type { DrawingId } from '@/components/ui/drawings'
import type { MediaImage } from './media'

/**
 * SAMPLE CONTENT. The project and magazine archive is PRD Phase 3 (UC-05/UC-06) and has no
 * entries yet. These illustrative projects show how archived work will carry discipline,
 * year and team metadata. Team members are intentionally not named: public views never
 * expose personal details (PRD NFR-04). Every card is labelled "Sample".
 */

export interface ArchiveProject {
  id: string
  sample: boolean
  title: string
  discipline: DisciplineId
  year: string
  team: string
  summary: string
  /** Link to a project detail page once the archive exists. */
  href: string | null
  drawing: DrawingId
  /** An authentic project photograph, when available; replaces the drawing. */
  image?: MediaImage
}

export const PROJECTS: ArchiveProject[] = [
  {
    id: 'line-following-rover',
    sample: true,
    title: 'Autonomous line-following rover',
    discipline: 'mechatronics',
    year: '2025–26',
    team: 'Team of 5',
    summary:
      'A competition rover that combines infrared sensing with PID steering, documented with wiring diagrams, code and test logs so next year’s team starts from a working baseline.',
    href: null,
    drawing: 'rover',
  },
  {
    id: 'water-quality-node',
    sample: true,
    title: 'Low-cost water-quality sensor node',
    discipline: 'electrical',
    year: '2025',
    team: 'Team of 3',
    summary: 'A solar-powered board that logs turbidity and temperature and reports readings over a low-power radio link.',
    href: null,
    drawing: 'sensor-node',
  },
  {
    id: 'seismic-truss-model',
    sample: true,
    title: 'Seismic-resistant truss model',
    discipline: 'civil',
    year: '2024',
    team: 'Team of 6',
    summary: 'A scale truss tested on a shake table, comparing bracing layouts for stiffness against weight.',
    href: null,
    drawing: 'truss',
  },
  {
    id: 'shelter-cooling-study',
    sample: true,
    title: 'Passive cooling study for campus shelters',
    discipline: 'mechanical',
    year: '2025',
    team: 'Team of 4',
    summary: 'Measured shade, airflow and surface temperatures to propose a lower-energy shelter design.',
    href: null,
    drawing: 'shelter',
  },
  {
    id: 'produced-water-bench',
    sample: true,
    title: 'Produced-water treatment bench model',
    discipline: 'chemical',
    year: '2024',
    team: 'Team of 4',
    summary: 'A bench-scale separation process that estimates how much oilfield water could be treated for reuse.',
    href: null,
    drawing: 'water-bench',
  },
]
