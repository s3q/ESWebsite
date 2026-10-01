'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { forwardRef, useCallback, useEffect, useRef, useState, type AnchorHTMLAttributes } from 'react'
import { PAGE_LINKS, SECTION_LINKS, SITE, sectionHref, type SectionId } from '@/content/site'
import { DESKTOP_QUERY } from '@/lib/motion'
import styles from './SiteHeader.module.css'

const SCROLL_THRESHOLD = 40

/** Same-page fragments stay native anchors (smooth scrolling); anything else routes client-side. */
const NavLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(
  function NavLink({ href, ...rest }, ref) {
    if (href.startsWith('#')) return <a ref={ref} href={href} {...rest} />
    return <Link ref={ref} href={href} {...rest} />
  },
)

export function SiteHeader() {
  const pathname = usePathname()
  const onHome = pathname === '/'
  const joinHref = SITE.membershipUrl ?? sectionHref('join', onHome)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<SectionId | null>(null)
  const headerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  // Strengthen the bar after a short scroll. rAF-throttled, passive, and only flips state
  // when the boolean actually changes, so scrolling never re-renders the header.
  useEffect(() => {
    let ticking = false
    let current = false
    const update = () => {
      ticking = false
      const next = window.scrollY > SCROLL_THRESHOLD
      if (next !== current) {
        current = next
        setScrolled(next)
      }
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll-spy: the section crossing the upper-middle band of the viewport is current.
  useEffect(() => {
    const sections = SECTION_LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (!sections.length) return
    const visible = new Map<string, boolean>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting)
        const first = SECTION_LINKS.find((l) => visible.get(l.id))
        setActive(first ? first.id : null)
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) menuButtonRef.current?.focus()
  }, [])

  // Menu keyboard + viewport handling.
  useEffect(() => {
    if (!open) return
    firstLinkRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close(true)
      }
    }
    const desktop = window.matchMedia(DESKTOP_QUERY)
    const onDesktop = () => desktop.matches && close(false)
    document.addEventListener('keydown', onKey)
    desktop.addEventListener('change', onDesktop)
    return () => {
      document.removeEventListener('keydown', onKey)
      desktop.removeEventListener('change', onDesktop)
    }
  }, [open, close])

  // Close when keyboard focus leaves the header entirely.
  const onBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (!open) return
    const next = e.relatedTarget as Node | null
    if (next && !headerRef.current?.contains(next)) close(false)
  }

  return (
    <>
      <header
        ref={headerRef}
        className={styles.header}
        data-scrolled={scrolled || undefined}
        data-open={open || undefined}
        onBlur={onBlur}
      >
        <div className={styles.bar}>
          <NavLink href={onHome ? '#top' : '/'} className={styles.brand}>
            <Image
              src="/brand/es-emblem.webp"
              alt=""
              width={44}
              height={44}
              priority
              className={styles.emblem}
            />
            <span className={styles.brandText}>
              <span className={styles.brandName}>{SITE.name}</span>
              <span className={styles.brandSub}>{SITE.affiliation}</span>
            </span>
            <span className="visually-hidden">{onHome ? ', back to top' : ', home'}</span>
          </NavLink>

          <nav aria-label="Sections" className={styles.nav}>
            <ul className={styles.links}>
              {SECTION_LINKS.map((link) => (
                <li key={link.id}>
                  <NavLink
                    href={sectionHref(link.id, onHome)}
                    className={styles.link}
                    aria-current={onHome && active === link.id ? 'location' : undefined}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              {PAGE_LINKS.map((link) => (
                <li key={link.href}>
                  <NavLink
                    href={link.href}
                    className={styles.link}
                    aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <NavLink href={joinHref} className={`btn btn--primary btn--compact ${styles.join}`}>
              Join the Society
            </NavLink>
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuButton}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
              <span className={styles.menuIcon} aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>

        <div id="site-menu" className={styles.panel}>
          <nav aria-label="Sections">
            <ul className={styles.panelLinks}>
              {SECTION_LINKS.map((link, i) => (
                <li key={link.id}>
                  <NavLink
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={sectionHref(link.id, onHome)}
                    className={styles.panelLink}
                    aria-current={onHome && active === link.id ? 'location' : undefined}
                    onClick={() => close(false)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              {PAGE_LINKS.map((link) => (
                <li key={link.href}>
                  <NavLink
                    href={link.href}
                    className={styles.panelLink}
                    aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
                    onClick={() => close(false)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <NavLink href={joinHref} className={`btn btn--primary ${styles.panelJoin}`} onClick={() => close(false)}>
            Join the Society
          </NavLink>
        </div>
      </header>
      <div className={styles.scrim} data-open={open || undefined} onClick={() => close(false)} aria-hidden="true" />
    </>
  )
}
