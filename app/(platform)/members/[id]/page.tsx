import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ScrollReveals } from '@/components/motion/ScrollReveals'
import { ProfileView } from '@/components/pages/profile/ProfileView'
import { ComingSoon } from '@/components/platform/ComingSoon'
import { isComingSoon } from '@/content/site'
import { getMemberProfile } from '@/lib/data'
import { getI18n } from '@/lib/i18n/server'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const [{ t, l }, profile] = await Promise.all([getI18n(), getMemberProfile(id)])
  const soon = t.platform.comingSoon
  if (isComingSoon('members')) return { title: soon.metaTitle(soon.modules.members.name), robots: { index: false } }
  if (!profile) return { title: t.platform.membersPage.metaTitle }
  return { title: `${l(profile.member.name)} · ${t.platform.membersPage.eyebrow}`, robots: { index: false } }
}

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  // Sample profiles (and the sample events they list) wait with the directory.
  if (isComingSoon('members')) return <ComingSoon module="members" />
  const { id } = await params
  const profile = await getMemberProfile(id)
  if (!profile) notFound()
  return (
    <>
      <ProfileView profile={profile} own={false} />
      <ScrollReveals />
    </>
  )
}
