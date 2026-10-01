'use client'

import { ScrollTrigger } from 'gsap/ScrollTrigger'
import dynamic from 'next/dynamic'
import Image, { getImageProps } from 'next/image'
import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { DESKTOP_QUERY, FINE_POINTER_QUERY, REDUCED_MOTION_QUERY } from '@/lib/motion'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { hasWebGL, prefersSaveData } from '@/lib/webgl'
import styles from './HeroArt.module.css'

const EmblemScene = dynamic(() => import('./emblem/EmblemScene'), { ssr: false })

const STILL_SIZE = 1280
const SIZES = '(min-width: 64rem) 55vw, 100vw'
const EMPTY = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const subscribeNever = () => () => {}

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

type IdleHandle = { cancel: () => void }

function whenIdle(cb: () => void): IdleHandle {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(cb, { timeout: 900 })
    return { cancel: () => window.cancelIdleCallback(id) }
  }
  const id = window.setTimeout(cb, 120)
  return { cancel: () => window.clearTimeout(id) }
}

/**
 * Rendered stills of the real scene. Before the 3D code arrives (and without JavaScript),
 * desktop shows the separated opening pose and reduced-motion shows the assembled emblem, so
 * the hero is complete at first paint. Mobile loads no still: its artwork sits below the copy.
 */
function StillPicture({ className }: { className: string }) {
  // Only the matching <source> is fetched, so eager loading costs mobile nothing.
  const common = { alt: '', width: STILL_SIZE, height: STILL_SIZE, sizes: SIZES, loading: 'eager' as const }
  const assembled = getImageProps({ ...common, src: '/hero/emblem-assembled.webp', fetchPriority: 'high' }).props
  const opening = getImageProps({ ...common, src: '/hero/emblem-opening.webp' }).props
  return (
    <picture className={className}>
      <source media="(prefers-reduced-motion: reduce)" srcSet={assembled.srcSet} sizes={SIZES} />
      <source media="(min-width: 64rem)" srcSet={opening.srcSet} sizes={SIZES} />
      <source media="(max-width: 63.99rem)" srcSet={EMPTY} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- decorative; alt="" comes from props */}
      <img {...assembled} />
    </picture>
  )
}

/** The designed static composition: reduced motion, Save-Data, or no WebGL. */
function AssembledStill({ className, eager }: { className: string; eager: boolean }) {
  return (
    <Image
      src="/hero/emblem-assembled.webp"
      alt=""
      width={STILL_SIZE}
      height={STILL_SIZE}
      sizes={SIZES}
      loading={eager ? 'eager' : 'lazy'}
      className={className}
    />
  )
}

export function HeroArt() {
  const [artEl, setArtEl] = useState<HTMLDivElement | null>(null)
  const [captionEl, setCaptionEl] = useState<HTMLParagraphElement | null>(null)
  const [near, setNear] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const activeRef = useRef(false)

  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY, false)
  const desktop = useMediaQuery(DESKTOP_QUERY, true)
  const finePointer = useMediaQuery(FINE_POINTER_QUERY, true)
  const capable = useSyncExternalStore(subscribeNever, () => hasWebGL() && !prefersSaveData(), () => true)

  const still = reducedMotion || !capable || failed
  const live = !still && near
  const sectionEl = artEl?.closest('section') ?? null

  // Load the 3D code once the artwork is near the viewport and the main thread is idle,
  // so the headline and actions never wait for WebGL.
  useEffect(() => {
    if (!artEl || still) return
    let idle: IdleHandle | null = null
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        io.disconnect()
        idle = whenIdle(() => setNear(true))
      },
      { rootMargin: '240px 0px' },
    )
    io.observe(artEl)
    return () => {
      io.disconnect()
      idle?.cancel()
    }
  }, [artEl, still])

  // Rendering pauses when the artwork is offscreen or the tab is hidden.
  useEffect(() => {
    if (!artEl) return
    let inView = false
    const update = () => {
      activeRef.current = inView && document.visibilityState === 'visible'
    }
    const io = new IntersectionObserver(([entry]) => {
      inView = Boolean(entry?.isIntersecting)
      update()
    })
    io.observe(artEl)
    document.addEventListener('visibilitychange', update)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [artEl])

  // Without the live sequence the hero drops its extra scroll length; re-measure triggers below.
  useEffect(() => {
    if (!still) return
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [still])

  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback(() => setFailed(true), [])

  const state = still ? 'still' : ready ? 'live' : 'loading'

  return (
    <div className={styles.figure}>
      <div ref={setArtEl} className={styles.art} data-state={state}>
        {/* A square frame: the canvas and the rendered stills share one geometry, so the live
            scene lands exactly on the still it replaces. */}
        <div className={styles.frame}>
          {still ? (
            <AssembledStill className={styles.image} eager={desktop} />
          ) : (
            <StillPicture className={styles.placeholder} />
          )}

          {live && (
            <div className={styles.canvas} aria-hidden="true">
              <SceneBoundary onError={onError}>
                <EmblemScene
                  quality={desktop ? 'high' : 'low'}
                  pointer={desktop && finePointer}
                  activeRef={activeRef}
                  sectionEl={sectionEl}
                  artEl={artEl}
                  captionEl={captionEl}
                  onReady={onReady}
                  onError={onError}
                />
              </SceneBoundary>
            </div>
          )}
        </div>
        {/* The line that resolves the sequence, set just beneath the completed emblem. */}
        <p ref={setCaptionEl} className={styles.caption}>
          <span className={styles.mark} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          Different disciplines, one society.
        </p>
      </div>
    </div>
  )
}
