'use client'

import { LOCALES, LOCALE_NAME, i18nFor } from '@/lib/i18n'
import { useI18n, useLocaleSwitch } from './I18nProvider'
import styles from './LanguageSwitch.module.css'

/**
 * English | العربية. Each option is written in its own language and tagged with its `lang`, so
 * it is recognisable (and correctly pronounced) whichever language the page is in.
 * `compact` is the small-screen form: one button that names the other language.
 */
export function LanguageSwitch({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { locale, t } = useI18n()
  const { switchLocale, pending } = useLocaleSwitch()

  if (compact) {
    const next = locale === 'en' ? 'ar' : 'en'
    return (
      <button
        type="button"
        className={[styles.toggle, className].filter(Boolean).join(' ')}
        lang={next}
        aria-label={i18nFor(next).t.nav.switchTo}
        data-pending={pending || undefined}
        onClick={() => switchLocale(next)}
      >
        <span aria-hidden="true">{next === 'ar' ? 'ع' : 'EN'}</span>
      </button>
    )
  }

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={[styles.switch, className].filter(Boolean).join(' ')}
      data-pending={pending || undefined}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          className={styles.option}
          aria-pressed={l === locale}
          onClick={() => switchLocale(l)}
        >
          {LOCALE_NAME[l]}
        </button>
      ))}
    </div>
  )
}
