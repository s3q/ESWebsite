/**
 * The society's social accounts — the single place to configure them.
 *
 * No verified account URLs exist in the project yet (Draft 1's footer used empty `#` links),
 * so every `url` is null and the footer's "Follow the Society" area stays hidden. Paste the
 * full profile URL for each account the society actually runs, for example
 * 'https://www.instagram.com/<handle>/'. Accounts left as null are simply not shown.
 *
 * URLs are validated: they must be https, on the platform's own domain, and point to a
 * profile path — a bare platform homepage is rejected.
 */

export type SocialPlatform = 'instagram' | 'x' | 'linkedin' | 'youtube' | 'tiktok'

export interface SocialAccount {
  platform: SocialPlatform
  /** Accessible platform name shown beside the icon. */
  label: string
  url: string | null
}

export const SOCIAL_ACCOUNTS: SocialAccount[] = [
  { platform: 'instagram', label: 'Instagram', url: null },
  { platform: 'x', label: 'X', url: null },
  { platform: 'linkedin', label: 'LinkedIn', url: null },
  { platform: 'youtube', label: 'YouTube', url: null },
  { platform: 'tiktok', label: 'TikTok', url: null },
]

const PLATFORM_HOSTS: Record<SocialPlatform, string[]> = {
  instagram: ['instagram.com'],
  x: ['x.com', 'twitter.com'],
  linkedin: ['linkedin.com'],
  youtube: ['youtube.com'],
  tiktok: ['tiktok.com'],
}

export function isValidProfileUrl(platform: SocialPlatform, url: string | null): url is string {
  if (!url) return false
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const onPlatform = PLATFORM_HOSTS[platform].some((h) => host === h || host.endsWith(`.${h}`))
    const hasProfilePath = u.pathname.replace(/\/+$/, '').length > 1
    return u.protocol === 'https:' && onPlatform && hasProfilePath
  } catch {
    return false
  }
}

/** Accounts with a valid, configured profile URL — the only ones the footer renders. */
export const ACTIVE_SOCIAL_ACCOUNTS = SOCIAL_ACCOUNTS.filter(
  (a): a is SocialAccount & { url: string } => isValidProfileUrl(a.platform, a.url),
)
