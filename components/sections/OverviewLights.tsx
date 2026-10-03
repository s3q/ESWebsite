'use client'

import { useEffect, useRef } from 'react'
import { DESKTOP_QUERY, FINE_POINTER_QUERY, REDUCED_MOTION_QUERY } from '@/lib/motion'
import styles from './Overview.module.css'

/**
 * Small points of light drifting through the overview's atmosphere, like phone lights held up
 * across a dark hall. One 2D canvas, drawn only while the section is on screen.
 *
 * Every light has a depth (z): far lights are small, sharp and slow; near lights are larger,
 * softer and quicker. Depth drives everything, so the field reads as three-dimensional:
 *  - drift and float: a slow heading plus two out-of-phase sine wanders;
 *  - twinkle: a gentle, per-light brightness breath;
 *  - scroll: near lights travel further than far ones as the section passes (parallax),
 *    against the photograph, which drifts the other way;
 *  - pointer (desktop, fine pointers): near lights lean further toward the cursor.
 * Reduced motion: one still frame, redrawn only on resize.
 */

type Light = {
  x: number // 0..1 across the canvas
  y: number // 0..1 down the canvas
  z: number // depth, 0.15 far … 1 near
  vx: number // px/s heading
  vy: number
  ax: number // wander amplitudes, px
  ay: number
  wx: number // wander rates, rad/s
  wy: number
  tw: number // twinkle rate, rad/s
  p1: number // phases
  p2: number
  p3: number
  alpha: number
  size: number // sprite diameter, CSS px
  warm: boolean
}

/** Deterministic randomness: the same field on every visit and every resize. */
function prng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeLights(count: number): Light[] {
  const rand = prng(20001)
  return Array.from({ length: count }, () => {
    // More far lights than near ones, as in a real crowd.
    const z = 0.15 + Math.pow(rand(), 1.8) * 0.85
    const heading = rand() * Math.PI * 2
    const speed = 2 + z * 9
    const near = z > 0.78
    return {
      x: rand(),
      y: rand(),
      z,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed * 0.6 - 1.5 * z, // a faint upward float
      ax: 4 + z * 14,
      ay: 3 + z * 10,
      wx: 0.12 + rand() * 0.28,
      wy: 0.1 + rand() * 0.25,
      tw: 0.5 + rand() * 1.6,
      p1: rand() * Math.PI * 2,
      p2: rand() * Math.PI * 2,
      p3: rand() * Math.PI * 2,
      // Near lights are out of focus: bigger, softer, dimmer per pixel.
      alpha: near ? 0.16 + rand() * 0.12 : 0.4 + (1 - z) * 0.3 + rand() * 0.16,
      size: near ? 26 + z * 22 + rand() * 10 : 5 + z * 13 + rand() * 4,
      warm: rand() > 0.32,
    }
  })
}

/** A pre-rendered glow: a hot core fading out, warm (phone light) or cool (blue hour). */
function sprite(warm: boolean, soft: boolean) {
  const s = 64
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  const rgb = warm ? '255, 232, 196' : '206, 224, 255'
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  if (soft) {
    grad.addColorStop(0, `rgba(${rgb}, 0.85)`)
    grad.addColorStop(0.35, `rgba(${rgb}, 0.45)`)
    grad.addColorStop(0.7, `rgba(${rgb}, 0.12)`)
  } else {
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
    grad.addColorStop(0.12, `rgba(${rgb}, 0.95)`)
    grad.addColorStop(0.32, `rgba(${rgb}, 0.32)`)
    grad.addColorStop(0.6, `rgba(${rgb}, 0.06)`)
  }
  grad.addColorStop(1, `rgba(${rgb}, 0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  return c
}

export function OverviewLights() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const section = canvas?.closest('section')
    const ctx = canvas?.getContext('2d')
    if (!canvas || !section || !ctx) return

    const reduced = window.matchMedia(REDUCED_MOTION_QUERY)
    const desktop = window.matchMedia(DESKTOP_QUERY)
    const fine = window.matchMedia(FINE_POINTER_QUERY)
    const sprites = {
      warm: sprite(true, false),
      cool: sprite(false, false),
      warmSoft: sprite(true, true),
      coolSoft: sprite(false, true),
    }

    let width = 0
    let height = 0
    let lights: Light[] = []
    let raf = 0
    let inView = false
    let last = 0
    let time = 0
    let lean = 0
    let leanTarget = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      // Soft glows don't need full density: phones render at up to 1.25×, desktops 2×.
      const dpr = Math.min(window.devicePixelRatio || 1, desktop.matches ? 2 : 1.25)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(desktop.matches ? 96 : 56, Math.max(26, (width * height) / (desktop.matches ? 12500 : 10500))))
      if (lights.length !== count) lights = makeLights(count)
    }

    const draw = () => {
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 as the section enters at the bottom, 1 as it leaves at the top.
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)))
      const still = reduced.matches
      const travel = still ? 0 : (progress - 0.5) * (desktop.matches ? 300 : 200)
      const t = still ? 0 : time

      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'
      const margin = 60
      const spanX = width + margin * 2
      const spanY = height + margin * 2
      for (const l of lights) {
        const x0 = l.x * width + l.vx * t + l.ax * Math.sin(t * l.wx + l.p1) + lean * 26 * l.z
        // Near lights rise faster than far ones as the page scrolls: depth through parallax.
        const y0 = l.y * height + l.vy * t + l.ay * Math.sin(t * l.wy + l.p2) - travel * l.z
        const x = ((((x0 + margin) % spanX) + spanX) % spanX) - margin
        const y = ((((y0 + margin) % spanY) + spanY) % spanY) - margin
        const breath = still ? 0.85 : 0.72 + 0.28 * Math.sin(t * l.tw + l.p3)
        const soft = l.size > 24
        ctx.globalAlpha = l.alpha * breath
        const img = soft ? (l.warm ? sprites.warmSoft : sprites.coolSoft) : l.warm ? sprites.warm : sprites.cool
        ctx.drawImage(img, x - l.size / 2, y - l.size / 2, l.size, l.size)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    const frame = (now: number) => {
      // Clamp the step so a long pause (tab switch, scroll away) never makes lights jump.
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      time += dt
      lean += (leanTarget - lean) * Math.min(1, dt * 3)
      draw()
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (raf || reduced.matches || !inView || document.visibilityState !== 'visible') return
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const sync = () => {
      stop()
      if (reduced.matches) draw()
      else start()
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(entry?.isIntersecting)
        if (inView) start()
        else stop()
      },
      { rootMargin: '80px 0px' },
    )
    const ro = new ResizeObserver(() => {
      resize()
      draw()
    })
    const onPointer = (e: PointerEvent) => {
      if (!desktop.matches || !fine.matches) return
      const r = section.getBoundingClientRect()
      leanTarget = (e.clientX - r.left) / r.width - 0.5
    }
    const onLeave = () => {
      leanTarget = 0
    }

    resize()
    draw()
    io.observe(section)
    ro.observe(canvas)
    section.addEventListener('pointermove', onPointer)
    section.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', sync)
    reduced.addEventListener('change', sync)
    desktop.addEventListener('change', resize)

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      section.removeEventListener('pointermove', onPointer)
      section.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', sync)
      reduced.removeEventListener('change', sync)
      desktop.removeEventListener('change', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.lights} data-lights="" />
}
