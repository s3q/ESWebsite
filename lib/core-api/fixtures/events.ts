/*
 * DEVELOPMENT AND TEST FIXTURES ONLY. Synthetic events in the shape of the DRAFT Core v1
 * contract (types.ts), used when CORE_API_MODE=fixtures (or in local development with no Core
 * configured). They are never served on a production deployment: config.server.ts refuses
 * fixture mode there, and the pages label fixture listings as samples.
 *
 * Dates are relative to "now", so the fixtures never go stale. Every availability the draft
 * vocabulary knows appears at least once, plus one unrecognised label and one date-only event,
 * so each presentation state can be seen and tested. No real people, no real attendees.
 */

type Locale = 'en' | 'ar'
type L = { en: string; ar: string }

interface FixtureEvent {
  id: string
  /** Days from today; negative is the past. */
  inDays: number
  /** Oman local time, or null for a date-only event. */
  time: string | null
  title: L
  description: L
  location: L
  committeeName: L
  availability: string
}

const COMMITTEE = {
  activities: { en: 'Activities Committee', ar: 'لجنة الأنشطة' },
  projects: { en: 'Projects Committee', ar: 'لجنة المشاريع' },
  relations: { en: 'Relations Committee', ar: 'لجنة العلاقات' },
  members: { en: 'Members & Graduates Committee', ar: 'لجنة شؤون الأعضاء والخريجين' },
  exhibition: { en: 'Exhibition Committee', ar: 'لجنة المعرض' },
} as const

export const FIXTURE_EVENTS: readonly FixtureEvent[] = [
  {
    id: '8f2c6a1e-0b5d-4c7e-9a3f-1d2e3c4b5a60',
    inDays: 6,
    time: '16:00',
    title: { en: 'Intro to Robotics Workshop', ar: 'ورشة مدخل إلى الروبوتات' },
    description: {
      en: 'A hands-on build session for first-time robotics students: wire a sensor, program a microcontroller and leave with a prototype that moves.\n\nNo experience is needed. Components are provided on the day.',
      ar: 'جلسة بناء تطبيقية للمبتدئين في الروبوتات: صِل مستشعرًا، وبرمج متحكّمًا دقيقًا، وغادر ومعك نموذج أولي يتحرك.\n\nلا تلزم خبرة سابقة، وتُوفَّر المكونات يوم الورشة.',
    },
    location: { en: 'College of Engineering, on campus', ar: 'كلية الهندسة، داخل الحرم الجامعي' },
    committeeName: COMMITTEE.activities,
    availability: 'available',
  },
  {
    id: '3b9d7e21-6c4a-4f8b-8e1d-2a3b4c5d6e71',
    inDays: 18,
    time: '18:30',
    title: { en: 'Engineering Careers Panel', ar: 'ندوة المسارات المهنية الهندسية' },
    description: {
      en: 'Graduates from across the disciplines on life after university: first roles, graduate study and what they wish they had started sooner.',
      ar: 'خريجون من مختلف التخصصات يتحدثون عن الحياة بعد الجامعة: الوظائف الأولى، والدراسات العليا، وما تمنّوا لو بدؤوه مبكرًا.',
    },
    location: { en: 'On campus', ar: 'داخل الحرم الجامعي' },
    committeeName: COMMITTEE.members,
    availability: 'waitlist',
  },
  {
    id: 'c4e8a2f0-7d1b-4e9c-a5f6-3b4c5d6e7f82',
    inDays: 27,
    time: '08:30',
    title: { en: 'Sustainable Infrastructure Site Visit', ar: 'زيارة ميدانية لمشروع بنية تحتية مستدامة' },
    description: {
      en: 'A guided look inside a civil project in Muscat, from foundations to finishing works.',
      ar: 'جولة بصحبة مرشد داخل مشروع إنشائي في مسقط، من الأساسات حتى أعمال التشطيب.',
    },
    location: { en: 'Off-campus site, Muscat', ar: 'موقع خارج الحرم الجامعي، مسقط' },
    committeeName: COMMITTEE.relations,
    availability: 'full',
  },
  {
    id: 'smart-campus-hackathon-fixture',
    inDays: 41,
    time: null,
    title: { en: 'Smart Campus Hackathon', ar: 'هاكاثون الحرم الذكي' },
    description: {
      en: 'Teams prototype sensing and data ideas for a more efficient campus over one day.',
      ar: 'تبني الفرق خلال يوم واحد نماذج أولية لأفكار في الاستشعار والبيانات من أجل حرم جامعي أكثر كفاءة.',
    },
    location: { en: 'Engineering laboratories', ar: 'مختبرات الهندسة' },
    committeeName: COMMITTEE.projects,
    availability: 'closed',
  },
  {
    id: '5a1f3c7d-9e2b-4a6c-b8d0-4c5d6e7f8093',
    inDays: 55,
    time: '14:00',
    title: { en: 'SolidWorks Fundamentals Bootcamp', ar: 'معسكر أساسيات سوليدووركس' },
    description: {
      en: 'Three afternoons of parametric modelling, from first sketch to assembly drawing.',
      ar: 'ثلاث أمسيات في النمذجة البارامترية، من أول رسم تخطيطي حتى رسم التجميع.',
    },
    location: { en: 'Computer laboratory', ar: 'مختبر الحاسوب' },
    committeeName: COMMITTEE.activities,
    availability: 'available',
  },
  {
    id: '9d4b2e6f-1a3c-4d7e-8f90-5d6e7f8091a4',
    inDays: 70,
    time: '09:00',
    title: { en: 'Process Plant Visit', ar: 'زيارة مصنع للعمليات' },
    description: {
      en: 'A visit to an operating process plant, by invitation of the host company.',
      ar: 'زيارة إلى مصنع عمليات قيد التشغيل، بدعوة من الشركة المستضيفة.',
    },
    location: { en: 'Sohar Industrial Port', ar: 'ميناء صحار الصناعي' },
    committeeName: COMMITTEE.relations,
    // Deliberately outside the draft vocabulary: shows the neutral "unknown" presentation.
    availability: 'invitation_only',
  },
  {
    id: '2e7c9a4b-5f1d-4b8e-9c0a-6e7f8091a2b5',
    inDays: -9,
    time: '14:00',
    title: { en: 'Lab Safety Essentials', ar: 'أساسيات السلامة في المختبر' },
    description: {
      en: 'Hazard spotting, safe tool use and what to do when something goes wrong, before the semester’s lab work starts.',
      ar: 'رصد المخاطر، والاستخدام الآمن للأدوات، وما يجب فعله عند حدوث خطأ، قبل بدء أعمال المختبر في الفصل.',
    },
    location: { en: 'Engineering laboratories', ar: 'مختبرات الهندسة' },
    committeeName: COMMITTEE.activities,
    availability: 'closed',
  },
  {
    id: '7c3e1b9d-2a6f-4c8d-a0b1-7f8091a2b3c6',
    inDays: -34,
    time: '10:00',
    title: { en: 'Engineering Gathering Exhibition', ar: 'معرض التجمع الهندسي' },
    description: {
      en: 'Every discipline under one roof: student projects, society stands and a day of demonstrations.',
      ar: 'جميع التخصصات تحت سقف واحد: مشاريع الطلبة وأجنحة الجماعات ويوم من العروض.',
    },
    location: { en: 'Main hall', ar: 'القاعة الرئيسية' },
    committeeName: COMMITTEE.exhibition,
    availability: 'closed',
  },
]

const omanDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Muscat', year: 'numeric', month: '2-digit', day: '2-digit' })

/** The fixture's date, `inDays` from `now`, in Oman time. */
function dateFor(event: FixtureEvent, now: Date) {
  const day = omanDay.format(new Date(now.getTime() + event.inDays * 86_400_000))
  return event.time ? `${day}T${event.time}:00+04:00` : day
}

/** One fixture event as Core would send it (raw JSON, unvalidated). */
export function fixtureEventDto(event: FixtureEvent, locale: Locale, now: Date): Record<string, unknown> {
  return {
    id: event.id,
    title: event.title[locale],
    description: event.description[locale],
    eventDate: dateFor(event, now),
    location: event.location[locale],
    committeeName: event.committeeName[locale],
    availability: event.availability,
  }
}

/** GET /v1/events, as a fixture body. */
export function fixtureEventList(locale: Locale, now: Date): unknown {
  return { events: FIXTURE_EVENTS.map((e) => fixtureEventDto(e, locale, now)) }
}

/** GET /v1/events/{id}, as a fixture body, or null for a 404. */
export function fixtureEventDetail(id: string, locale: Locale, now: Date): unknown | null {
  const event = FIXTURE_EVENTS.find((e) => e.id === id)
  return event ? fixtureEventDto(event, locale, now) : null
}

/** A response Core should never send: the parser must reject it, and the page must cope. */
export const MALFORMED_EVENT_LIST: unknown = { events: [{ id: 42, title: null, eventDate: 'next tuesday' }, 'not an event'] }
