import { Hero } from '@/components/hero/Hero'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { InViewMarker } from '@/components/motion/InViewMarker'
import { ScrollReveals } from '@/components/motion/ScrollReveals'
import { Activities } from '@/components/sections/Activities'
import { Disciplines } from '@/components/sections/Disciplines'
import { Events } from '@/components/sections/Events'
import { JoinInvitation } from '@/components/sections/JoinInvitation'
import { Leadership } from '@/components/sections/Leadership'
import { Overview } from '@/components/sections/Overview'
import { Projects } from '@/components/sections/Projects'
import { StatsStrip } from '@/components/sections/StatsStrip'
import { SOCIETY_STATS } from '@/content/stats'

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <Hero />
        <StatsStrip stats={SOCIETY_STATS} />
        <Overview />
        <Events />
        <Activities />
        <Projects />
        <Disciplines />
        <Leadership />
        <JoinInvitation />
      </main>
      <SiteFooter />
      <ScrollReveals />
      <InViewMarker selector="[data-symbol-row], [data-activity]" />
    </>
  )
}
