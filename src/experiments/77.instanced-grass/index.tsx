'use client'

import { Environment, PerspectiveCamera } from '@react-three/drei'
import { Suspense } from 'react'

import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

import Scene from './_components/scene'

function GrassScene() {
  return (
    <>
      <Environment files="/textures/grass/illus_sky.hdr" background />
      <PerspectiveCamera
        makeDefault
        position={[-8.544, -0.922, 9.638]}
        // test pos {[-4, 40, 4]}
        fov={65}
      />
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </>
  )
}

GrassScene.Layout = R3FCanvasLayout
GrassScene.Title = 'Instanced Grass'
GrassScene.Description = 'Instanced grass'

export default GrassScene
