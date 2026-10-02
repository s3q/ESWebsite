import type { Localized } from '@/lib/i18n'
import type { MediaImage } from './media'

/**
 * The society's recurring programmes (not dated events — those live in content/events.ts).
 *
 * EDITORIAL STATUS
 * - `nameAr` is the society's own name for each programme and is shown as the title.
 * - `nameEn` is a working English label for readers of the English site. It is NOT an
 *   official title; replace it with the society's preferred wording.
 * - Every `description` is a DRAFT written only from the programme's name
 *   (`descriptionStatus: 'draft'`). Confirm or rewrite each one before launch.
 *   أستوديو الخريجين deliberately has no assumed description.
 * - `stats` must only ever hold real figures with their period. None have been supplied.
 * - `photos.main` holds the society's own photograph of the programme, supplied with the
 *   project (one per programme). `focus` keeps the subject in frame when the layout crops it.
 * - `href` links to previous editions or details once such a page exists.
 */

export type ActivityId = 'gathering' | 'programme' | 'graduate-workshops' | 'graduate-studio' | 'evenings' | 'competitions'

export interface ActivityStat {
  value: string
  label: Localized
  /** e.g. '2024–25'. Required for any count. */
  period: Localized
}

export interface Activity {
  id: ActivityId
  nameAr: string
  nameEn: string
  description: Localized
  descriptionStatus: 'draft' | 'confirmed' | 'needs-input'
  photos: { main: MediaImage | null; supporting: MediaImage[] }
  stats: ActivityStat[]
  href: string | null
}

export const ACTIVITIES: Activity[] = [
  {
    id: 'gathering',
    nameAr: 'الملتقى الهندسي',
    nameEn: 'Engineering Gathering',
    description: {
      en: 'A gathering that brings students from across the engineering disciplines together in one place.',
      ar: 'ملتقى يجمع طلاب التخصصات الهندسية المختلفة في مكان واحد.',
    },
    descriptionStatus: 'draft',
    photos: {
      main: {
        src: '/images/activities/gathering.jpg',
        width: 1170,
        height: 762,
        alt: {
          en: 'The Engineering Gathering’s exhibition hall: visitors walk between lit display panels around a glowing geometric sculpture.',
          ar: 'قاعة معرض الملتقى الهندسي: زوّار يتجولون بين لوحات عرض مضيئة حول مجسّم هندسي متوهّج.',
        },
      },
      supporting: [],
    },
    stats: [],
    href: null,
  },
  {
    id: 'programme',
    nameAr: 'البرنامج الهندسي',
    nameEn: 'Engineering Programme',
    description: {
      en: 'A structured programme of engineering activities for students across the college.',
      ar: 'برنامج منظّم من الأنشطة الهندسية لطلاب الكلية من مختلف التخصصات.',
    },
    descriptionStatus: 'draft',
    photos: {
      main: {
        src: '/images/activities/programme.jpg',
        width: 2400,
        height: 1600,
        focus: '60% 50%',
        alt: {
          en: 'A student presents “Reservoir Simulation Modelling” to classmates seated in a lecture room.',
          ar: 'طالب يقدّم عرضًا بعنوان «نمذجة محاكاة المكامن» أمام زملائه في قاعة محاضرات.',
        },
      },
      supporting: [],
    },
    stats: [],
    href: null,
  },
  {
    id: 'graduate-workshops',
    nameAr: 'ورش الخريجين',
    nameEn: 'Graduate Workshops',
    description: {
      en: 'Workshops that connect current students with the society’s graduates.',
      ar: 'ورش عمل تصل الطلاب الحاليين بخريجي الجمعية.',
    },
    descriptionStatus: 'draft',
    photos: {
      main: {
        src: '/images/activities/graduate-workshops.jpg',
        width: 1600,
        height: 2400,
        // A portrait photograph in a landscape frame: keep the student at the laptop.
        focus: '50% 88%',
        alt: {
          en: 'Students working at computers in a lab; in the foreground, one models a 3D shape on a laptop.',
          ar: 'طلاب يعملون على الحواسيب في مختبر، وفي المقدمة طالب يصمّم مجسّمًا ثلاثي الأبعاد على حاسوبه المحمول.',
        },
      },
      supporting: [],
    },
    stats: [],
    href: null,
  },
  {
    id: 'graduate-studio',
    nameAr: 'أستوديو الخريجين',
    nameEn: 'Graduate Studio',
    // Needs the society's own description: the name alone does not say what the programme does.
    description: {
      en: 'A description of this programme will be added by the society.',
      ar: 'ستضيف الجمعية وصفًا لهذا البرنامج.',
    },
    descriptionStatus: 'needs-input',
    photos: {
      main: {
        src: '/images/activities/graduate-studio.jpg',
        width: 2400,
        height: 1600,
        alt: {
          en: 'A graduate in a bisht poses in a decorated photo corner, his reflection caught in a standing mirror.',
          ar: 'خرّيج يرتدي البشت في ركن تصوير مزيّن، وتنعكس صورته في مرآة قائمة.',
        },
      },
      supporting: [],
    },
    stats: [],
    href: null,
  },
  {
    id: 'evenings',
    nameAr: 'الأمسيات',
    nameEn: 'Evenings',
    description: {
      en: 'Evening sessions that bring the society’s members together.',
      ar: 'أمسيات تجمع أعضاء الجمعية.',
    },
    descriptionStatus: 'draft',
    photos: {
      main: {
        src: '/images/activities/evenings.jpg',
        width: 1170,
        height: 652,
        alt: {
          en: 'A speaker stands on stage facing an audience holding up phone lights in a darkened hall.',
          ar: 'متحدّث يقف على المسرح أمام جمهور يرفع أضواء هواتفه في قاعة معتمة.',
        },
      },
      supporting: [],
    },
    stats: [],
    href: null,
  },
  {
    id: 'competitions',
    nameAr: 'المسابقات',
    nameEn: 'Competitions',
    description: {
      en: 'Competitions that invite students to put their engineering skills to the test.',
      ar: 'مسابقات تدعو الطلاب إلى اختبار مهاراتهم الهندسية.',
    },
    descriptionStatus: 'draft',
    photos: {
      main: {
        src: '/images/activities/competitions.jpg',
        width: 2400,
        height: 1603,
        alt: {
          en: 'Two students inspect entries laid out on a display table in a large auditorium.',
          ar: 'طالبان يتفقّدان أعمالًا معروضة على طاولة في قاعة كبيرة.',
        },
      },
      supporting: [],
    },
    stats: [],
    href: null,
  },
]

export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a])) as Record<ActivityId, Activity>

/**
 * Previous editions of these programmes, for the /activities archive. Add one record per
 * edition as it is documented; the archive's programme and year filters come from this data.
 */
export interface ActivityEdition {
  id: string
  activity: ActivityId
  title: Localized
  year: number
  summary?: Localized
  image?: MediaImage
  href?: string
}

export const ACTIVITY_EDITIONS: ActivityEdition[] = []
