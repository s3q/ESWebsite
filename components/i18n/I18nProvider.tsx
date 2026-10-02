'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useTransition, type ReactNode } from 'react'
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_STORAGE_KEY,
  i18nFor,
  isLocale,
  type I18n,
  type Locale,
} from '@/lib/i18n'

gsap.registerPlugin(ScrollTrigger)

const I18nContext = createContext<I18n>(i18nFor('en'))
const SwitchContext = createContext<{ switchLocale: (next: Locale) => void; pending: boolean }>({
  switchLocale: () => {},
  pending: false,
})

function saveLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Storage can be unavailable (private mode); the cookie alone is enough.
  }
}

function hasLocaleCookie() {
  return document.cookie.split('; ').some((c) => c.startsWith(`${LOCALE_COOKIE}=`))
}

/**
 * Client side of the language system. The server decides the language from the cookie and
 * passes it here; switching saves the choice and refreshes the route, so the server re-renders
 * every string, `lang` and `dir` in one commit. There is no page reload: client state, scroll
 * position and the hero's 3D scene stay as they are.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const switchLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return
      saveLocale(next)
      startTransition(() => router.refresh())
    },
    [locale, router],
  )

  // The cookie is the source of truth. If cookies were cleared but this browser remembers a
  // choice, restore it once.
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    if (hasLocaleCookie()) return
    let saved: string | null = null
    try {
      saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    } catch {
      return
    }
    if (isLocale(saved) && saved !== locale) switchLocale(saved)
  }, [locale, switchLocale])

  // A new direction and new text lengths move every section: re-measure scroll-linked motion.
  const previous = useRef(locale)
  useEffect(() => {
    if (previous.current === locale) return
    previous.current = locale
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [locale])

  const switcher = useMemo(() => ({ switchLocale, pending }), [switchLocale, pending])

  return (
    <SwitchContext.Provider value={switcher}>
      <I18nContext.Provider value={i18nFor(locale)}>{children}</I18nContext.Provider>
    </SwitchContext.Provider>
  )
}

/** Client Components: `const { t, l, locale, dir } = useI18n()`. */
export const useI18n = () => useContext(I18nContext)
export const useLocaleSwitch = () => useContext(SwitchContext)
