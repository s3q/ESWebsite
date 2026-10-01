'use client'

import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { DESKTOP_QUERY, MOTION, STACKED_QUERY } from '@/lib/motion'
import { MODULES, SEAT_OFFSET, createBody, createPlate, createReliefs, type Quality } from './geometry'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Vec3 = [number, number, number]

/** Deliberate start transforms: four distinct modules, balanced and slightly separated. */
const START: { position: Vec3; rotation: Vec3 }[] = [
  { position: [-1.42, 1.36, 0.34], rotation: [0.16, -0.3, 0.06] }, // derrick
  { position: [1.4, 1.42, -0.28], rotation: [-0.13, 0.28, -0.05] }, // span
  { position: [-1.38, -1.42, -0.24], rotation: [0.17, 0.24, -0.05] }, // circuit
  { position: [1.44, -1.36, 0.3], rotation: [-0.18, -0.26, 0.07] }, // gear
]
/** Shared alignment: squared up to one plane, still apart. */
const ALIGN_OFFSET = 1.24
/** Stacked layouts tell the same story with fewer moving parts: no rotations, no camera move. */
const STACKED_OFFSET = 1.3
const GEAR_START_SPIN = -0.7

const CAMERA = {
  start: [2.5, 1.2, 12.6] as Vec3,
  mid: [1.0, 0.55, 12.9] as Vec3,
  end: [0.55, 0.3, 12.6] as Vec3,
  stacked: [0.9, 0.5, 12.8] as Vec3,
}
/** The completed emblem turns to a presentation angle and gains a little presence. */
const SETTLE = { y: -0.1, x: 0.04, scale: 1.08 }
const COMPOSITION = { width: 5.6, height: 5.5, cap: 1.1 }
/** Stacked layouts have no rotations or camera move, so the emblem can fill its frame. */
const COMPOSITION_STACKED = { width: 4.9, height: 5, cap: 1.42 }

export interface EmblemSceneProps {
  quality: Quality
  /** Pointer tilt (fine-pointer desktops only). */
  pointer: boolean
  /** Whether the canvas is on screen and the tab is visible. */
  activeRef: RefObject<boolean>
  /** Hero section: drives the sticky desktop sequence. */
  sectionEl: HTMLElement | null
  /** Artwork frame: drives the shorter sequence on stacked layouts. */
  artEl: HTMLElement | null
  /** The "one society" line that resolves the sequence. */
  captionEl: HTMLElement | null
  onReady: () => void
  onError: () => void
  /** Capture mode renders one fixed pose (0 = separated, 1 = assembled) for the still image. */
  capturePose?: number
}

export default function EmblemScene(props: EmblemSceneProps) {
  const { quality, capturePose, onError } = props
  const capture = capturePose !== undefined
  const cam = capture && capturePose >= 1 ? CAMERA.end : CAMERA.start

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, quality === 'high' ? 2 : 1.5]}
      shadows={quality === 'high' ? 'percentage' : false}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: capture }}
      camera={{ fov: 30, position: cam, near: 0.1, far: 80 }}
      style={{ pointerEvents: 'none' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping
        gl.toneMappingExposure = 1.02
        gl.setClearColor(0x000000, 0)
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onError()
        })
      }}
    >
      <Studio quality={quality} />
      <Emblem {...props} capture={capture} />
    </Canvas>
  )
}

function Studio({ quality }: { quality: Quality }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      {/* Key light: on desktop it casts soft shadows from each relief onto its ivory body. */}
      <directionalLight
        position={[-2.6, 4.2, 9]}
        intensity={1.45}
        castShadow={quality === 'high'}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={4}
        shadow-camera-left={-3.6}
        shadow-camera-right={3.6}
        shadow-camera-top={3.6}
        shadow-camera-bottom={-3.6}
      />
      <directionalLight position={[5, -2, 4]} intensity={0.3} color="#fff3de" />
      {/* Soft studio reflections from in-scene light panels: no HDR download, rendered once. */}
      <Environment resolution={quality === 'high' ? 256 : 128} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 5, 3]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-6, 1, 3]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#fff1d6" position={[6, 0.5, 3]} rotation-y={-Math.PI / 2} scale={[5, 3, 1]} />
        <color attach="background" args={['#b9bec7']} />
      </Environment>
    </>
  )
}

function Emblem({
  quality,
  pointer,
  activeRef,
  sectionEl,
  artEl,
  captionEl,
  onReady,
  capture,
  capturePose,
}: EmblemSceneProps & { capture: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera

  // Separate channels: pointer tilt, intro, sculpture settle, and per-module scroll transforms.
  const pointerGroup = useRef<THREE.Group>(null)
  const introGroup = useRef<THREE.Group>(null)
  const sculptGroup = useRef<THREE.Group>(null)
  const moduleRefs = useRef<(THREE.Group | null)[]>([])
  const gearRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(
    () => ({ plate: createPlate(quality), body: createBody(quality), reliefs: createReliefs(quality) }),
    [quality],
  )

  const materials = useMemo(
    () => ({
      ivory: new THREE.MeshPhysicalMaterial({
        color: '#efebe0',
        roughness: 0.48,
        clearcoat: 0.35,
        clearcoatRoughness: 0.4,
      }),
      satin: new THREE.MeshPhysicalMaterial({ color: '#c8cdd5', metalness: 1, roughness: 0.4 }),
      accents: MODULES.map(
        (m) =>
          new THREE.MeshPhysicalMaterial({
            color: m.accent,
            metalness: 0.2,
            roughness: 0.36,
            clearcoat: 0.5,
            clearcoatRoughness: 0.3,
          }),
      ),
    }),
    [],
  )

  useEffect(
    () => () => {
      geometry.plate.dispose()
      geometry.body.dispose()
      Object.values(geometry.reliefs).forEach((g) => g.dispose())
    },
    [geometry],
  )
  useEffect(
    () => () => {
      materials.ivory.dispose()
      materials.satin.dispose()
      materials.accents.forEach((m) => m.dispose())
    },
    [materials],
  )

  const fit = useMemo(() => {
    const c = quality === 'low' ? COMPOSITION_STACKED : COMPOSITION
    const distance = camera.position.length()
    const visibleH = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const visibleW = visibleH * (size.width / Math.max(size.height, 1))
    return Math.min(c.cap, visibleW / c.width, visibleH / c.height)
  }, [camera, quality, size.width, size.height])

  useEffect(() => invalidate(), [fit, invalidate])

  useEffect(() => {
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (capture) (window as unknown as { __emblemReady?: boolean }).__emblemReady = true
        onReady()
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [capture, onReady])

  useGSAP(
    () => {
      const modules = moduleRefs.current.filter((m): m is THREE.Group => m !== null)
      const gearMesh = gearRef.current
      const sculpt = sculptGroup.current
      if (modules.length !== 4 || !gearMesh || !sculpt) return

      const cam = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
      const applyCamera = () => {
        camera.position.set(cam.x, cam.y, cam.z)
        camera.lookAt(0, 0, 0)
      }
      const render = () => invalidate()
      const renderCamera = () => {
        applyCamera()
        invalidate()
      }

      const seat = (i: number, offset: number): Vec3 => [
        MODULES[i].quadrant[0] * offset,
        MODULES[i].quadrant[1] * offset,
        0,
      ]

      const poseSeparated = () => {
        modules.forEach((m, i) => {
          m.position.set(...START[i].position)
          m.rotation.set(...START[i].rotation)
        })
        gearMesh.rotation.z = GEAR_START_SPIN
        sculpt.rotation.set(0, 0, 0)
        sculpt.scale.setScalar(1)
      }
      const poseAssembled = () => {
        modules.forEach((m, i) => {
          m.position.set(...seat(i, SEAT_OFFSET))
          m.rotation.set(0, 0, 0)
        })
        gearMesh.rotation.z = 0
        sculpt.rotation.set(SETTLE.x, SETTLE.y, 0)
        sculpt.scale.setScalar(SETTLE.scale)
        Object.assign(cam, { x: CAMERA.end[0], y: CAMERA.end[1], z: CAMERA.end[2] })
      }

      if (capture) {
        if ((capturePose ?? 0) >= 1) poseAssembled()
        else poseSeparated()
        applyCamera()
        invalidate()
        return
      }

      // Intro: the sculpture settles into view with a small, controlled turn.
      if (introGroup.current) {
        gsap.fromTo(
          introGroup.current.rotation,
          { y: -0.14 },
          { y: 0, duration: MOTION.hero.introDuration, ease: MOTION.ease, onUpdate: render },
        )
        gsap.fromTo(
          introGroup.current.scale,
          { x: 0.96, y: 0.96, z: 0.96 },
          { x: 1, y: 1, z: 1, duration: MOTION.hero.introDuration, ease: MOTION.ease, onUpdate: render },
        )
      }

      const mm = gsap.matchMedia()

      // Desktop: one coordinated timeline across the sticky hero (≈ one extra viewport).
      mm.add(DESKTOP_QUERY, () => {
        if (!sectionEl) return
        poseSeparated()
        Object.assign(cam, { x: CAMERA.start[0], y: CAMERA.start[1], z: CAMERA.start[2] })
        applyCamera()

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          onUpdate: render,
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top top',
            end: 'bottom bottom',
            scrub: MOTION.hero.scrub,
          },
        })

        // Early: the camera shifts perspective while modules square up toward one plane.
        tl.to(cam, { x: CAMERA.mid[0], y: CAMERA.mid[1], z: CAMERA.mid[2], duration: 0.42, ease: 'sine.inOut', onUpdate: renderCamera }, 0)
        modules.forEach((m, i) => {
          const [x, y] = seat(i, ALIGN_OFFSET)
          tl.to(m.rotation, { x: 0, y: 0, z: 0, duration: 0.4, ease: MOTION.easeInOut }, i * 0.02)
          tl.to(m.position, { x, y, z: 0, duration: 0.4, ease: MOTION.easeInOut }, i * 0.02)
        })

        // Middle: the four connect into one emblem; the gear turns as it engages.
        modules.forEach((m, i) => {
          const [x, y] = seat(i, SEAT_OFFSET)
          tl.to(m.position, { x, y, duration: 0.28, ease: 'power3.inOut' }, 0.44 + i * 0.015)
        })
        tl.to(gearMesh.rotation, { z: 0, duration: 0.34, ease: MOTION.easeInOut }, 0.42)

        // End: the completed sculpture settles as Events comes into view.
        tl.to(cam, { x: CAMERA.end[0], y: CAMERA.end[1], z: CAMERA.end[2], duration: 0.26, ease: 'sine.out', onUpdate: renderCamera }, 0.74)
        tl.to(sculpt.rotation, { x: SETTLE.x, y: SETTLE.y, duration: 0.26, ease: 'power2.out' }, 0.74)
        tl.to(sculpt.scale, { x: SETTLE.scale, y: SETTLE.scale, z: SETTLE.scale, duration: 0.26, ease: 'power2.out' }, 0.74)
        if (captionEl) tl.fromTo(captionEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.16, ease: 'power2.out' }, 0.8)

        return () => {
          if (captionEl) gsap.set(captionEl, { clearProps: 'opacity,transform' })
        }
      })

      // Stacked: a shorter version tied to the artwork itself, with no pinning or camera move.
      mm.add(STACKED_QUERY, () => {
        if (!artEl) return
        modules.forEach((m, i) => {
          m.position.set(...seat(i, STACKED_OFFSET))
          m.rotation.set(0, 0, 0)
        })
        gearMesh.rotation.z = GEAR_START_SPIN
        sculpt.rotation.set(0, 0, 0)
        sculpt.scale.setScalar(1)
        Object.assign(cam, { x: CAMERA.stacked[0], y: CAMERA.stacked[1], z: CAMERA.stacked[2] })
        applyCamera()

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          onUpdate: render,
          scrollTrigger: { trigger: artEl, start: 'top 85%', end: 'center 40%', scrub: 0.6 },
        })
        modules.forEach((m, i) => {
          const [x, y] = seat(i, SEAT_OFFSET)
          tl.to(m.position, { x, y, duration: 0.7, ease: 'power3.inOut' }, 0)
        })
        tl.to(gearMesh.rotation, { z: 0, duration: 0.7, ease: MOTION.easeInOut }, 0)
        if (captionEl) tl.fromTo(captionEl, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.7)

        return () => {
          if (captionEl) gsap.set(captionEl, { clearProps: 'opacity' })
        }
      })

      return () => mm.revert()
    },
    { dependencies: [sectionEl, artEl, captionEl, capture, capturePose, geometry] },
  )

  // Pointer tilt (±4°) on its own group, plus the render driver that pauses offscreen.
  useEffect(() => {
    if (capture) return
    const tilt = pointerGroup.current
    let removePointer = () => {}

    if (pointer && tilt) {
      const max = MOTION.hero.pointerMaxRad
      const toX = gsap.quickTo(tilt.rotation, 'x', { duration: 0.9, ease: MOTION.ease, onUpdate: () => invalidate() })
      const toY = gsap.quickTo(tilt.rotation, 'y', { duration: 0.9, ease: MOTION.ease, onUpdate: () => invalidate() })
      const onMove = (e: PointerEvent) => {
        if (!activeRef.current || e.pointerType !== 'mouse') return
        toY(((e.clientX / window.innerWidth) * 2 - 1) * max)
        toX(((e.clientY / window.innerHeight) * 2 - 1) * max * 0.6)
      }
      const onLeave = () => {
        toX(0)
        toY(0)
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeave)
      removePointer = () => {
        window.removeEventListener('pointermove', onMove)
        document.documentElement.removeEventListener('pointerleave', onLeave)
        gsap.killTweensOf(tilt.rotation)
      }
    }

    // Frames are drawn on demand by the tweens; when the canvas becomes visible again,
    // draw once so it reflects any scroll progress made while hidden.
    let wasActive = false
    const tick = () => {
      const active = Boolean(activeRef.current)
      if (active && !wasActive) invalidate()
      wasActive = active
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      removePointer()
    }
  }, [pointer, activeRef, capture, invalidate])

  return (
    <group scale={fit}>
      <group ref={pointerGroup}>
        <group ref={introGroup}>
          <group ref={sculptGroup}>
            {MODULES.map((m, i) => (
              <group
                key={m.id}
                ref={(el) => {
                  moduleRefs.current[i] = el
                }}
                position={START[i].position}
                rotation={START[i].rotation}
              >
                <mesh geometry={geometry.plate} material={materials.satin} rotation-z={m.leafRotation} receiveShadow />
                <mesh
                  geometry={geometry.body}
                  material={materials.ivory}
                  rotation-z={m.leafRotation}
                  castShadow
                  receiveShadow
                />
                <mesh
                  ref={m.id === 'gear' ? gearRef : undefined}
                  castShadow
                  receiveShadow
                  geometry={geometry.reliefs[m.id]}
                  material={materials.accents[i]}
                  rotation-z={m.id === 'gear' ? GEAR_START_SPIN : 0}
                />
              </group>
            ))}
          </group>
        </group>
      </group>
      {quality === 'high' ? (
        // An invisible "page" just behind the sculpture that only shows the key light's shadow:
        // the relief appears to float a hand's width off the page, and the shadow draws in as
        // the modules close.
        <mesh position={[0, 0, -0.7]} receiveShadow>
          <planeGeometry args={[14, 14]} />
          <shadowMaterial transparent opacity={0.085} color="#13233c" />
        </mesh>
      ) : (
        // Phones: no shadow maps, just a soft contact halo behind the modules.
        <ContactShadows
          position={[0, 0, -0.9]}
          rotation-x={Math.PI / 2}
          opacity={0.3}
          scale={8}
          blur={2.6}
          far={1.6}
          resolution={256}
          color="#13233c"
        />
      )}
    </group>
  )
}
