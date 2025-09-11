'use client'
import { Suspense } from 'react'
import Scene from './_components/scene'

import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

function DitheringScene() {
  return (
    <>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </>
  )
}

DitheringScene.Layout = R3FCanvasLayout
DitheringScene.Title = '78. Metallic Dithering'
DitheringScene.Description = 'A metallic shader with ordered dithering effect'

export default DitheringScene
