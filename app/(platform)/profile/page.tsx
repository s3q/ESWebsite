import type { Metadata } from 'next'
import { ScrollReveals } from '@/components/motion/ScrollReveals'
import { ProfileView } from '@/components/pages/profile/ProfileView'
import { ComingSoon } from '@/components/platform/ComingSoon'
import { isComingSoon } from '@/content/site'
import { getCurrentMember } from '@/lib/data'
import { getI18n } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  const soon = t.platform.comingSoon
  if (isComingSoon('profile')) return { title: soon.metaTitle(soon.modules.profile.name), robots: { index: false } }
  return { title: `${t.platform.nav.profile} · ${t.site.name}`, robots: { index: false } }
}

/**
 * The signed-in member's own profile. Member accounts belong to the Core Platform, so until
 * they exist this is Coming Soon; the prototype (a sample member) stays behind the flag.
 */
export default async function ProfilePage() {
  if (isComingSoon('profile')) return <ComingSoon module="profile" />
  const profile = await getCurrentMember()
  return (
    <>
      <ProfileView profile={profile} own />
      <ScrollReveals />
    </>
  )
}
