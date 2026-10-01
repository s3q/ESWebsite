'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'

const EmblemScene = dynamic(() => import('@/components/hero/emblem/EmblemScene'), { ssr: false })

const noop = () => {}

export function EmblemCapture({ pose }: { pose: number }) {
  const activeRef = useRef(true)

  useEffect(() => {
    document.body.style.background = 'transparent'
  }, [])

  return (
    <div id="capture" style={{ width: 640, height: 640 }}>
      <EmblemScene
        quality="high"
        pointer={false}
        activeRef={activeRef}
        sectionEl={null}
        artEl={null}
        captionEl={null}
        onReady={noop}
        onError={noop}
        capturePose={pose}
      />
    </div>
  )
}
