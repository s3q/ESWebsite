import { pluralAr, pluralEn } from '../../plural'

const arCount = (n: number, one: string, two: string, few: string, many: string) =>
  pluralAr(n, { zero: () => `0 ${many}`, one: () => one, two: () => two, few: (c) => `${c} ${few}`, many: (c) => `${c} ${many}`, other: (c) => `${c} ${many}` })

/** /activities — the archive cabinet. */
export const activitiesEn = {
  metaTitle: 'Archive · Engineering Society',
  metaDescription: 'Explore past Engineering Society activities, events, programmes, competitions, photos, and records from previous years.',
  eyebrow: 'Engineering Society',
  title: 'Archive',
  lead: 'Explore past Engineering Society activities, events, programmes, competitions, photos, and records from previous years.',
  cabinetLabel: 'The archive cabinet: one drawer per activity',
  editions: (n: number) => pluralEn(n, 'edition', 'editions'),
  searchPlaceholder: 'Search titles and summaries',
  searchLabel: 'Search the archive',
  archiveLabel: 'Archived editions',
  attendees: (n: string) => `${n} attendees`,
  visitors: (n: string) => `${n} visitors`,
  photos: (n: number) => pluralEn(n, 'photograph', 'photographs'),
  open: 'Open edition',
  photoOf: (i: number, n: number) => `Photograph ${i} of ${n}`,
  previous: 'Previous photograph',
  next: 'Next photograph',
  thumbs: 'Photographs',
  undated: 'Undated',
  undatedNote: 'The date will be added as the society documents this record.',
  inActivity: 'Activity',
  moreIn: (name: string) => `More from ${name}`,
  emptyTitle: 'No editions archived yet',
  emptyBody: 'As the society documents past editions, each will be filed here by activity and year, with photographs where available.',
  emptyActivity: 'No editions of this activity have been archived yet.',
}

export type ActivitiesCopy = typeof activitiesEn

export const activitiesAr: ActivitiesCopy = {
  metaTitle: 'الأرشيف · الجماعة الهندسية',
  metaDescription: 'استكشف أرشيف الجماعة الهندسية من الفعاليات والبرامج والمسابقات والصور والسجلات من الأعوام السابقة.',
  eyebrow: 'الجماعة الهندسية',
  title: 'الأرشيف',
  lead: 'استكشف أرشيف الجماعة الهندسية من الفعاليات والبرامج والمسابقات والصور والسجلات من الأعوام السابقة.',
  cabinetLabel: 'خزانة الأرشيف: درج لكل نشاط',
  editions: (n: number) => arCount(n, 'نسخة واحدة', 'نسختان', 'نسخ', 'نسخة'),
  searchPlaceholder: 'ابحث في العناوين والملخصات',
  searchLabel: 'ابحث في الأرشيف',
  archiveLabel: 'النسخ المؤرشفة',
  attendees: (n: string) => `${n} حاضر`,
  visitors: (n: string) => `${n} زائر`,
  photos: (n: number) => arCount(n, 'صورة واحدة', 'صورتان', 'صور', 'صورة'),
  open: 'افتح النسخة',
  photoOf: (i: number, n: number) => `الصورة ${i} من ${n}`,
  previous: 'الصورة السابقة',
  next: 'الصورة التالية',
  thumbs: 'الصور',
  undated: 'غير مؤرّخ',
  undatedNote: 'سيُضاف التاريخ مع توثيق الجماعة لهذا السجل.',
  inActivity: 'النشاط',
  moreIn: (name: string) => `المزيد من ${name}`,
  emptyTitle: 'لم تُؤرشف أي نسخة بعد',
  emptyBody: 'مع توثيق الجماعة لنسخها السابقة، ستُحفظ كل نسخة هنا حسب النشاط والسنة، مع الصور حين تتوفر.',
  emptyActivity: 'لم تُؤرشف أي نسخة من هذا النشاط بعد.',
}

/** /events and /events/[id]. Events come from the Core API; this is only their interface copy. */
export const eventsEn = {
  metaTitle: 'Events · Engineering Society',
  metaDescription: 'Workshops, talks, site visits and competitions from the Engineering Society.',
  eyebrow: 'Events',
  title: 'One line through the society’s year.',
  lead: 'Workshops, talks, visits and competitions on a single timeline: what has happened, where today falls, and what comes next.',
  featured: 'Featured',
  searchPlaceholder: 'Search events',
  searchLabel: 'Search events',
  when: 'When',
  whenOptions: { upcoming: 'Upcoming', month: 'This month', past: 'Past' },
  timelineLabel: 'Event timeline',
  today: 'Today',
  todayNote: 'You are here',
  nextUp: 'Next up',
  showEarlier: (n: number) => `Show ${pluralEn(n, 'earlier event', 'earlier events')}`,
  showFewer: 'Show fewer',
  upcomingTitle: 'Coming up',
  pastTitle: 'Already happened',
  noUpcoming: 'Nothing upcoming matches these filters.',
  view: 'View event',
  stats: { upcoming: 'Upcoming', thisMonth: 'This month', open: 'Open for registration' },
  fixtureNotice: {
    strong: 'Development fixtures.',
    body: 'These events are synthetic test data, not events published by the society. Registration here is simulated: nothing is sent.',
  },
  unavailableTitle: 'Events can’t be shown right now',
  unavailableBody: 'The society’s events platform couldn’t be reached. Nothing is wrong on your side; please try again in a moment.',

  /** How Core's availability reads on cards, badges and the registration panel. */
  availability: {
    open: 'Registration open',
    waitlist: 'Waitlist open',
    full: 'Full',
    closed: 'Registration closed',
    unknown: 'Registration not available online',
    past: 'Event completed',
  },

  // Detail
  back: 'All events',
  about: 'About this event',
  aboutEmpty: 'More details will be added by the organising committee.',
  details: 'Details',
  date: 'Date',
  time: 'Time',
  location: 'Location',
  organiser: 'Organised by',
  moreUpcoming: 'Also coming up',
  timezone: 'Oman time (UTC+4)',
  allEvents: 'See all events',
  detailUnavailableTitle: 'This event can’t be loaded right now',
  detailUnavailableBody: 'The society’s events platform couldn’t be reached. Try again in a moment, or see the full list of events.',

  // Registration: the form is the landing's; every outcome is the events platform's answer.
  registration: 'Registration',
  register: 'Register',
  joinWaitlist: 'Join the waitlist',
  formTitle: 'Register for this event',
  formWaitlistTitle: 'Join the waitlist',
  fields: { fullName: 'Full name', email: 'Email address' },
  fieldErrors: {
    fullName: { required: 'Enter your full name.', invalid: 'Enter your full name, between 2 and 120 characters.' },
    email: { required: 'Enter your email address.', invalid: 'Enter a valid email address, like name@example.com.' },
  },
  submitting: 'Sending…',
  privacy: 'Your name and email are sent to the Engineering Society’s events platform to process this registration.',
  fixtureNote: 'Development fixture: nothing is sent. Test addresses at example.test show each outcome.',
  pastNote: 'This event has finished.',
  fullNote: 'This event is full.',
  closedNote: 'Registration has closed for this event.',
  unknownNote: 'Registration for this event isn’t available on this site. For details, contact the organising committee.',
  notEnabledNote: 'Online registration for this event isn’t open on this site yet.',
  notConfiguredNote: 'Registration is temporarily unavailable. Please try again later.',
  outcomes: {
    registered: { title: 'You’re registered', body: 'The events platform confirmed your registration.' },
    waitlisted: { title: 'You’re on the waitlist', body: 'The events platform added you to the waitlist for this event.' },
    alreadyRegistered: 'You’re already registered for this event.',
    alreadyWaitlisted: 'You’re already on the waitlist for this event.',
    eventFull: 'This event filled up before your registration went through.',
    registrationClosed: 'Registration closed before your registration went through.',
    invalid: 'Check the highlighted details and try again.',
    rateLimited: (seconds: number | null) =>
      seconds === null || seconds < 1
        ? 'Too many attempts. Please wait a moment, then try again.'
        : seconds < 120
          ? `Too many attempts. Try again in ${pluralEn(seconds, 'second', 'seconds')}.`
          : `Too many attempts. Try again in ${pluralEn(Math.ceil(seconds / 60), 'minute', 'minutes')}.`,
    unavailable: 'Your registration couldn’t be completed right now, and nothing was confirmed. Please try again in a moment.',
    unconfirmed: 'The events platform answered, but your registration couldn’t be confirmed. Try again later; if you’re already registered, you’ll be told.',
    rejected: 'Your registration couldn’t be completed for this event.',
  },

  // The member check-in pass (profile prototype).
  passTitle: 'Check-in pass',
  passPreview: 'Preview only: not a valid ticket.',
  passEvent: 'Event',
  passCode: 'Pass',
  passHint: 'Organisers scan this at the door; your attendance then appears in your profile.',
}

export type EventsCopy = typeof eventsEn

export const eventsAr: EventsCopy = {
  metaTitle: 'الفعاليات · الجماعة الهندسية',
  metaDescription: 'ورش عمل ومحاضرات وزيارات ميدانية ومسابقات من الجماعة الهندسية.',
  eyebrow: 'الفعاليات',
  title: 'خطٌّ واحد عبر عام الجماعة.',
  lead: 'ورش ومحاضرات وزيارات ومسابقات على خط زمني واحد: ما مضى، وموقع اليوم، وما هو قادم.',
  featured: 'مميّزة',
  searchPlaceholder: 'ابحث في الفعاليات',
  searchLabel: 'ابحث في الفعاليات',
  when: 'الموعد',
  whenOptions: { upcoming: 'القادمة', month: 'هذا الشهر', past: 'السابقة' },
  timelineLabel: 'الخط الزمني للفعاليات',
  today: 'اليوم',
  todayNote: 'أنت هنا',
  nextUp: 'التالية',
  showEarlier: (n: number) =>
    pluralAr(n, {
      zero: () => 'لا فعاليات أقدم',
      one: () => 'اعرض فعالية أقدم',
      two: () => 'اعرض فعاليتين أقدم',
      few: (c) => `اعرض ${c} فعاليات أقدم`,
      many: (c) => `اعرض ${c} فعالية أقدم`,
      other: (c) => `اعرض ${c} فعالية أقدم`,
    }),
  showFewer: 'اعرض أقل',
  upcomingTitle: 'القادم',
  pastTitle: 'ما مضى',
  noUpcoming: 'لا فعاليات قادمة تطابق هذه المرشحات.',
  view: 'عرض الفعالية',
  stats: { upcoming: 'القادمة', thisMonth: 'هذا الشهر', open: 'مفتوحة للتسجيل' },
  fixtureNotice: {
    strong: 'بيانات تطوير تجريبية.',
    body: 'هذه الفعاليات بيانات اختبار مصطنعة، وليست فعاليات نشرتها الجماعة. التسجيل هنا محاكاة ولا يُرسل شيء.',
  },
  unavailableTitle: 'تعذّر عرض الفعاليات الآن',
  unavailableBody: 'تعذّر الوصول إلى منصة فعاليات الجماعة. لا مشكلة من جهتك؛ حاول مرة أخرى بعد قليل.',

  availability: {
    open: 'التسجيل مفتوح',
    waitlist: 'قائمة الانتظار مفتوحة',
    full: 'مكتملة',
    closed: 'التسجيل مغلق',
    unknown: 'التسجيل غير متاح عبر الموقع',
    past: 'انتهت الفعالية',
  },

  back: 'كل الفعاليات',
  about: 'عن الفعالية',
  aboutEmpty: 'ستضيف اللجنة المنظِّمة مزيدًا من التفاصيل.',
  details: 'التفاصيل',
  date: 'التاريخ',
  time: 'الوقت',
  location: 'المكان',
  organiser: 'تنظيم',
  moreUpcoming: 'فعاليات قادمة أيضًا',
  timezone: 'بتوقيت عُمان (UTC+4)',
  allEvents: 'اعرض كل الفعاليات',
  detailUnavailableTitle: 'تعذّر تحميل هذه الفعالية الآن',
  detailUnavailableBody: 'تعذّر الوصول إلى منصة فعاليات الجماعة. حاول مرة أخرى بعد قليل، أو اعرض قائمة الفعاليات كاملة.',

  registration: 'التسجيل',
  register: 'سجّل',
  joinWaitlist: 'انضم إلى قائمة الانتظار',
  formTitle: 'سجّل في هذه الفعالية',
  formWaitlistTitle: 'انضم إلى قائمة الانتظار',
  fields: { fullName: 'الاسم الكامل', email: 'البريد الإلكتروني' },
  fieldErrors: {
    fullName: { required: 'أدخل اسمك الكامل.', invalid: 'أدخل اسمك الكامل، بين حرفين و120 حرفًا.' },
    email: { required: 'أدخل بريدك الإلكتروني.', invalid: 'أدخل بريدًا إلكترونيًا صحيحًا، مثل name@example.com.' },
  },
  submitting: 'جارٍ الإرسال…',
  privacy: 'يُرسل اسمك وبريدك الإلكتروني إلى منصة فعاليات الجماعة الهندسية لمعالجة هذا التسجيل.',
  fixtureNote: 'بيانات تطوير تجريبية: لا يُرسل شيء. تُظهر عناوين الاختبار على النطاق example.test كل نتيجة.',
  pastNote: 'انتهت هذه الفعالية.',
  fullNote: 'اكتملت هذه الفعالية.',
  closedNote: 'أُغلق التسجيل في هذه الفعالية.',
  unknownNote: 'التسجيل في هذه الفعالية غير متاح عبر هذا الموقع. للتفاصيل، تواصل مع اللجنة المنظِّمة.',
  notEnabledNote: 'لم يُفتح التسجيل الإلكتروني لهذه الفعالية على هذا الموقع بعد.',
  notConfiguredNote: 'التسجيل غير متاح مؤقتًا. حاول مرة أخرى لاحقًا.',
  outcomes: {
    registered: { title: 'تم تسجيلك', body: 'أكّدت منصة الفعاليات تسجيلك.' },
    waitlisted: { title: 'أنت على قائمة الانتظار', body: 'أضافتك منصة الفعاليات إلى قائمة الانتظار لهذه الفعالية.' },
    alreadyRegistered: 'أنت مسجّل في هذه الفعالية مسبقًا.',
    alreadyWaitlisted: 'أنت على قائمة الانتظار لهذه الفعالية مسبقًا.',
    eventFull: 'اكتملت الفعالية قبل إتمام تسجيلك.',
    registrationClosed: 'أُغلق التسجيل قبل إتمام تسجيلك.',
    invalid: 'راجع البيانات المحددة وحاول مرة أخرى.',
    rateLimited: (seconds: number | null) =>
      seconds === null || seconds < 1
        ? 'محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.'
        : seconds < 120
          ? `محاولات كثيرة. حاول مرة أخرى بعد ${arCount(seconds, 'ثانية واحدة', 'ثانيتين', 'ثوانٍ', 'ثانية')}.`
          : `محاولات كثيرة. حاول مرة أخرى بعد ${arCount(Math.ceil(seconds / 60), 'دقيقة واحدة', 'دقيقتين', 'دقائق', 'دقيقة')}.`,
    unavailable: 'تعذّر إتمام تسجيلك الآن، ولم يُؤكَّد شيء. حاول مرة أخرى بعد قليل.',
    unconfirmed: 'ردّت منصة الفعاليات، لكن تعذّر تأكيد تسجيلك. حاول لاحقًا؛ وإن كنت مسجّلًا مسبقًا فسيُبلغك النظام بذلك.',
    rejected: 'تعذّر إتمام تسجيلك في هذه الفعالية.',
  },

  passTitle: 'بطاقة الدخول',
  passPreview: 'معاينة فقط: ليست تذكرة صالحة.',
  passEvent: 'الفعالية',
  passCode: 'البطاقة',
  passHint: 'يمسحها المنظمون عند الباب، ثم يظهر حضورك في ملفك.',
}
