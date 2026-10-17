import type { Metadata } from 'next'
import { AttendanceLog } from '@/components/pages/profile/AttendanceLog'
import styles from '@/components/pages/profile/Profile.module.css'
import { Breadcrumbs } from '@/components/platform/Breadcrumbs'
import { ComingSoon } from '@/components/platform/ComingSoon'
import { PlatformHero, SampleNotice } from '@/components/platform/Platform'
import { isComingSoon } from '@/content/site'
import { getCurrentMember, getSampleEvents } from '@/lib/data'
import { getI18n } from '@/lib/i18n/server'
import { routes } from '@/lib/routes'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  const soon = t.platform.comingSoon
  if (isComingSoon('profile')) return { title: soon.metaTitle(soon.modules.profile.name), robots: { index: false } }
  return { title: `${t.platform.membersPage.attendanceTitle} · ${t.site.name}`, robots: { index: false } }
}

/** A member's own registrations and attendance: Core-owned records, so Coming Soon until accounts exist. */
export default async function AttendancePage() {
  if (isComingSoon('profile')) return <ComingSoon module="profile" />
  const { t } = await getI18n()
  const c = t.platform.membersPage
  const [me, events] = await Promise.all([getCurrentMember(), getSampleEvents()])
  return (
    <>
      <PlatformHero
        trail={<Breadcrumbs trail={[{ href: routes.profile, label: t.platform.nav.profile }]} current={c.attendanceTitle} />}
        eyebrow={c.you}
        title={c.attendanceTitle}
        lead={<p>{c.attendanceLead}</p>}
        layout="stack"
        tone="surface"
      >
        <p className="preview-note">
          <span className="status-dot" aria-hidden="true" />
          <span>{c.ownNote}</span>
        </p>
      </PlatformHero>
      <section className={styles.attendance} aria-label={c.attendanceTitle}>
        <div className="container">
          <AttendanceLog entries={me.attendance} events={events} certificates={me.certificates} />
          <SampleNotice className={styles.sample} />
        </div>
      </section>
    </>
  )
}
