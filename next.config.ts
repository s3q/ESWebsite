import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90],
  },
  // Next.js blocks dev-only assets for origins other than localhost. Without this, a phone that
  // opens the dev server at the computer's network address (e.g. http://192.168.8.158:3000)
  // receives the HTML but never hydrates: no menu, no animations, no 3D. Private network
  // ranges only, and development only; production builds are unaffected.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.*.*.*', '*.local'],
  // A stray lockfile in the home directory would otherwise be mistaken for the workspace root.
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default nextConfig
