import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EmblemCapture } from './EmblemCapture'

export const metadata: Metadata = { robots: { index: false, follow: false } }

/**
 * Development-only route used by scripts/capture-still.mjs to render the hero sculpture at a
 * fixed pose on a transparent background. The resulting image is the reduced-motion and
 * no-WebGL still, so it always matches the live scene. Returns 404 in production builds.
 */
export default async function EmblemCapturePage({
  searchParams,
}: {
  searchParams: Promise<{ pose?: string }>
}) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { pose = '0' } = await searchParams
  // 0 = desktop opening, 1 = assembled, 2 = phone/tablet opening
  const value = pose === '2' ? 2 : Math.min(1, Math.max(0, Number(pose) || 0))
  return <EmblemCapture pose={value} />
}
