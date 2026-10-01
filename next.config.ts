import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90],
  },
  // A stray lockfile in the home directory would otherwise be mistaken for the workspace root.
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default nextConfig
