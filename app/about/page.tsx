import type { Metadata } from 'next'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { ScrollReveals } from '@/components/motion/ScrollReveals'
import { JoinInvitation } from '@/components/sections/JoinInvitation'
import { Overview } from '@/components/sections/Overview'
import { PageIntro } from '@/components/sections/PageIntro'
import { StatsStrip } from '@/components/sections/StatsStrip'
import { Structure } from '@/components/sections/Structure'
import { SITE } from '@/content/site'

export const metadata: Metadata = {
  title: `About — ${SITE.name}`,
  description:
    'About the Engineering Society at Sultan Qaboos University: who we are, and how the society is organised.',
}

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <PageIntro eyebrow="Engineering Society · Sultan Qaboos University" title="About the society">
          <p>
            A student-run organisation at the College of Engineering, and the umbrella for the college’s seven
            engineering societies.
          </p>
        </PageIntro>
        <StatsStrip />
        <Overview aboutLink={false} />
        <Structure />
        <JoinInvitation onHome={false} />
      </main>
      <SiteFooter onHome={false} />
      <ScrollReveals />
    </>
  )
}
