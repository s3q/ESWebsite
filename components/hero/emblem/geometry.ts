import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

/**
 * The hero sculpture, derived from the society's four-part logo. Each module is the logo's
 * "leaf" — a circle joined to a square corner that points at the shared centre — built as an
 * ivory body on a satin-metal backing plate, carrying one of the logo's four symbols in
 * relief: derrick, aqueduct span, circuit traces and gear. The official logo itself is never
 * redrawn; this is a sculptural interpretation of its structure.
 *
 * Units: one tile has radius 1. Module-local origin = the leaf's circle centre, so each module
 * rotates about its own visual centre. The base leaf's sharp corner sits at (-1, -1).
 */

export type Quality = 'high' | 'low'
export type ModuleId = 'derrick' | 'span' | 'circuit' | 'gear'

export const TILE = {
  gap: 0.14,
  plateDepth: 0.07,
  bodyInset: 0.05,
  bodyDepth: 0.3,
  reliefDepth: 0.1,
} as const

/** Distance from the shared centre to each seated module's origin. */
export const SEAT_OFFSET = 1 + TILE.gap / 2

export interface ModuleSpec {
  id: ModuleId
  /** Which quadrant the module seats in: [x sign, y sign]. */
  quadrant: [number, number]
  /** Rotation that turns the base leaf so its sharp corner faces the centre. */
  leafRotation: number
  /** Accent sampled from the matching logo quadrant, deepened slightly for a satin enamel. */
  accent: string
}

export const MODULES: ModuleSpec[] = [
  { id: 'derrick', quadrant: [-1, 1], leafRotation: Math.PI / 2, accent: '#e0bf2c' },
  { id: 'span', quadrant: [1, 1], leafRotation: 0, accent: '#0a62a8' },
  { id: 'circuit', quadrant: [-1, -1], leafRotation: Math.PI, accent: '#74ab14' },
  { id: 'gear', quadrant: [1, -1], leafRotation: -Math.PI / 2, accent: '#a3200f' },
]

const detail = (q: Quality) => ({
  curve: q === 'high' ? 48 : 20,
  bevel: q === 'high' ? 4 : 2,
})

/* ---------------- 2D helpers ---------------- */

function leaf(r: number) {
  const s = new THREE.Shape()
  s.moveTo(-r, -r)
  s.lineTo(0, -r)
  s.absarc(0, 0, r, -Math.PI / 2, Math.PI, false)
  s.lineTo(-r, -r)
  return s
}

/** A straight member of width w between two points, ends extended so joints close cleanly. */
function bar(ax: number, ay: number, bx: number, by: number, w: number) {
  const dx = bx - ax
  const dy = by - ay
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const nx = (-uy * w) / 2
  const ny = (ux * w) / 2
  const ex = (ux * w) / 2
  const ey = (uy * w) / 2
  const s = new THREE.Shape()
  s.moveTo(ax - ex + nx, ay - ey + ny)
  s.lineTo(bx + ex + nx, by + ey + ny)
  s.lineTo(bx + ex - nx, by + ey - ny)
  s.lineTo(ax - ex - nx, ay - ey - ny)
  s.closePath()
  return s
}

function polyline(points: [number, number][], w: number) {
  const out: THREE.Shape[] = []
  for (let i = 0; i < points.length - 1; i++) {
    out.push(bar(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], w))
  }
  return out
}

function disc(cx: number, cy: number, r: number) {
  const s = new THREE.Shape()
  s.absarc(cx, cy, r, 0, Math.PI * 2, false)
  return s
}

function ring(cx: number, cy: number, ro: number, ri: number) {
  const s = disc(cx, cy, ro)
  const h = new THREE.Path()
  h.absarc(cx, cy, ri, 0, Math.PI * 2, true)
  s.holes.push(h)
  return s
}

/* ---------------- 3D helpers ---------------- */

function smooth(geometry: THREE.BufferGeometry) {
  geometry.deleteAttribute('normal')
  const merged = mergeVertices(geometry, 1e-4)
  merged.computeVertexNormals()
  geometry.dispose()
  return merged
}

function extrude(shapes: THREE.Shape | THREE.Shape[], depth: number, bevel: number, q: Quality) {
  const d = detail(q)
  return new THREE.ExtrudeGeometry(shapes, {
    depth,
    curveSegments: d.curve,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: d.bevel,
  })
}

/** Relief symbols sit on the body's front face (z = bodyDepth). */
function relief(shapes: THREE.Shape[], q: Quality) {
  const bevel = 0.014
  const g = extrude(shapes, TILE.reliefDepth - bevel * 2, bevel, q)
  g.translate(0, 0, TILE.bodyDepth + bevel)
  return g
}

/* ---------------- Parts ---------------- */

/** Satin-metal backing plate, z ∈ [-plateDepth, 0]. Shared by all four modules. */
export function createPlate(q: Quality) {
  const bevel = 0.014
  const g = extrude(leaf(1), TILE.plateDepth - bevel * 2, bevel, q)
  g.translate(0, 0, -TILE.plateDepth + bevel)
  return smooth(g)
}

/** Ivory body, z ∈ [0, bodyDepth], inset from the plate so a fine metal rim shows. */
export function createBody(q: Quality) {
  const bevel = 0.03
  const g = extrude(leaf(1 - TILE.bodyInset), TILE.bodyDepth - bevel * 2, bevel, q)
  g.translate(0, 0, bevel)
  return smooth(g)
}

/** Oil derrick: tapered lattice legs, cross-bracing, a centre mast and a flame. */
function derrick(q: Quality) {
  const w = 0.058
  const base = -0.66
  const top = 0.42
  const legX = (y: number) => 0.4 - ((y - base) / (top - base)) * 0.31
  const levels = [base, -0.27, 0.08, top]
  const shapes: THREE.Shape[] = [
    bar(-legX(base), base, -legX(top), top, w),
    bar(legX(base), base, legX(top), top, w),
    bar(0, base, 0, 0.5, w * 0.8),
    bar(-0.54, base, 0.54, base, w),
    bar(-0.2, top, 0.2, top, w),
  ]
  for (let i = 0; i < levels.length - 1; i++) {
    const a = levels[i]
    const b = levels[i + 1]
    if (i > 0) shapes.push(bar(-legX(a), a, legX(a), a, w * 0.85))
    shapes.push(bar(-legX(a), a, legX(b), b, w * 0.7), bar(legX(a), a, -legX(b), b, w * 0.7))
  }
  const flame = new THREE.Shape()
  flame.moveTo(0, 0.5)
  flame.bezierCurveTo(0.11, 0.55, 0.07, 0.7, 0, 0.82)
  flame.bezierCurveTo(-0.07, 0.7, -0.11, 0.55, 0, 0.5)
  shapes.push(flame)
  return relief(shapes, q)
}

/** Aqueduct span: a railing over an arcade of three arches. */
function span(q: Quality) {
  const w = 0.052
  const shapes: THREE.Shape[] = [bar(-0.72, 0.32, 0.72, 0.32, w), bar(-0.6, 0.5, 0.6, 0.5, w)]
  for (const x of [-0.48, -0.24, 0, 0.24, 0.48]) shapes.push(bar(x, 0.32, x, 0.5, w * 0.7))

  const arcade = new THREE.Shape()
  const bottom = -0.5
  const springLine = -0.12
  const r = 0.16
  arcade.moveTo(-0.72, bottom)
  arcade.lineTo(-0.72, 0.2)
  arcade.lineTo(0.72, 0.2)
  arcade.lineTo(0.72, bottom)
  for (const c of [0.45, 0, -0.45]) {
    arcade.lineTo(c + r, bottom)
    arcade.lineTo(c + r, springLine)
    arcade.absarc(c, springLine, r, 0, Math.PI, false)
    arcade.lineTo(c - r, bottom)
  }
  arcade.lineTo(-0.72, bottom)
  shapes.push(arcade)
  return relief(shapes, q)
}

/** Circuit: three traces with 45° bends, ring pads at the source and solid pads at the end. */
function circuit(q: Quality) {
  const w = 0.054
  const pad = 0.088
  const traces: [number, number][][] = [
    [[-0.55, 0.45], [-0.1, 0.45], [0.18, 0.17], [0.66, 0.17]],
    [[-0.66, 0.1], [-0.28, 0.1], [0.02, -0.2], [0.62, -0.2]],
    [[-0.44, -0.27], [-0.2, -0.27], [0.08, -0.55], [0.46, -0.55]],
  ]
  const shapes: THREE.Shape[] = []
  for (const t of traces) {
    const [sx, sy] = t[0]
    const [ex, ey] = t[t.length - 1]
    shapes.push(ring(sx, sy, pad, pad * 0.48), disc(ex, ey, pad * 0.78))
    shapes.push(...polyline([[sx + pad * 0.9, sy], ...t.slice(1)], w))
  }
  return relief(shapes, q)
}

/** Gear: toothed rim, three spokes and a small hub — built centred so it can turn in place. */
function gear(q: Quality) {
  const teeth = 22
  const outer = 0.74
  const root = 0.665
  const step = (Math.PI * 2) / teeth
  const rim = new THREE.Shape()
  for (let i = 0; i < teeth; i++) {
    const c = i * step
    const pts: [number, number][] = [
      [root, c - step * 0.32],
      [outer, c - step * 0.2],
      [outer, c + step * 0.2],
      [root, c + step * 0.32],
    ]
    pts.forEach(([rr, a], j) => {
      const x = rr * Math.cos(a)
      const y = rr * Math.sin(a)
      if (i === 0 && j === 0) rim.moveTo(x, y)
      else rim.lineTo(x, y)
    })
  }
  rim.closePath()
  const hole = new THREE.Path()
  hole.absarc(0, 0, 0.56, 0, Math.PI * 2, true)
  rim.holes.push(hole)

  const shapes: THREE.Shape[] = [rim, disc(0, 0, 0.085)]
  for (const deg of [90, 210, 330]) {
    const a = (deg * Math.PI) / 180
    shapes.push(bar(0, 0, Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.05))
  }
  return relief(shapes, q)
}

export function createReliefs(q: Quality): Record<ModuleId, THREE.BufferGeometry> {
  return { derrick: derrick(q), span: span(q), circuit: circuit(q), gear: gear(q) }
}
