import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic, Manrope, Space_Grotesk } from 'next/font/google'
import { SITE } from '@/content/site'
import '@/styles/globals.css'

// Only the weights the design uses. (Turbopack's loader rejects range strings like '500 700'.)
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-manrope',
  display: 'swap',
})

// Arabic names (activities, the society structure) keep their own typeface and direction.
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['500', '600'],
  variable: '--font-plex-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.affiliation}`,
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.affiliation}`,
    description: SITE.description,
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f7f8f2',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior lets Next jump instantly on route changes (e.g. /about#structure):
    // a smooth scroll would be cancelled when ScrollTrigger refreshes on the new page.
    <html
      lang="en"
      dir="ltr"
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${manrope.variable} ${plexArabic.variable}`}
    >
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
