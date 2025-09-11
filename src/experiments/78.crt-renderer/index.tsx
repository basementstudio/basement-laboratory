'use client'

import { Environment, PerspectiveCamera } from '@react-three/drei'
import { Suspense } from 'react'
import { SRGBColorSpace } from 'three'

import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

import { Scene } from './_components/scene'

function CrtRenderer() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 6]} fov={65} />
      <Suspense fallback={null}>
        <Environment
          files="/textures/grass/illus_sky.hdr"
          backgroundIntensity={2}
          environmentIntensity={1}
          background
        />
        <Scene />
      </Suspense>
    </>
  )
}

CrtRenderer.Title = 'CRT Renderer'
CrtRenderer.Description = 'CRT Renderer'

CrtRenderer.Layout = (props: any) => (
  <R3FCanvasLayout
    gl={{
      antialias: false,
      autoClear: false,
      powerPreference: 'high-performance',
      outputColorSpace: SRGBColorSpace,
      pixelRatio: 1
    }}
    {...props}
  />
)

export default CrtRenderer
