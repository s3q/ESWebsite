/**
 * The seven disciplines defined in Draft 1's project content (src/components/sections/
 * disciplineData.ts). This is the society's own list, not an official SQU department list.
 */

export type DisciplineId =
  | 'mechanical'
  | 'electrical'
  | 'civil'
  | 'petroleum'
  | 'chemical'
  | 'mechatronics'
  | 'industrial'

export interface Discipline {
  id: DisciplineId
  name: string
  shortName: string
  focus: string
  description: string
}

export const DISCIPLINES: Discipline[] = [
  {
    id: 'mechanical',
    name: 'Mechanical Engineering',
    shortName: 'Mechanical',
    focus: 'Motion & mechanisms',
    description: 'Designing machines, mechanisms and systems that turn ideas into motion.',
  },
  {
    id: 'electrical',
    name: 'Electrical & Computer Engineering',
    shortName: 'Electrical & Computer',
    focus: 'Circuits & computation',
    description: 'Connecting circuits, power and computation to make intelligent systems possible.',
  },
  {
    id: 'civil',
    name: 'Civil & Architectural Engineering',
    shortName: 'Civil & Architectural',
    focus: 'Structures & spaces',
    description: 'Shaping resilient structures and thoughtful spaces for the world we share.',
  },
  {
    id: 'petroleum',
    name: 'Petroleum Engineering',
    shortName: 'Petroleum',
    focus: 'Energy & exploration',
    description: 'Engineering the responsible exploration and production of energy resources.',
  },
  {
    id: 'chemical',
    name: 'Chemical Engineering',
    shortName: 'Chemical',
    focus: 'Matter & transformation',
    description: 'Transforming raw materials into useful products through carefully controlled processes.',
  },
  {
    id: 'mechatronics',
    name: 'Mechatronics Engineering',
    shortName: 'Mechatronics',
    focus: 'Robotics & control',
    description: 'Bringing mechanics, electronics and control together in responsive machines.',
  },
  {
    id: 'industrial',
    name: 'Industrial Engineering',
    shortName: 'Industrial',
    focus: 'Systems & production',
    description: 'Making production smarter by improving how people, materials and systems work together.',
  },
]

export const DISCIPLINE_BY_ID = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d])) as Record<
  DisciplineId,
  Discipline
>
