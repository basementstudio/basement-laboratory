import { ScrollProvider, tunnel } from '@basementstudio/definitive-scroll'
import { Canvas } from '@basementstudio/definitive-scroll/three'
import { OrbitControls, useTexture } from '@react-three/drei'
import { useFrame, useLoader } from '@react-three/fiber'
import { useControls } from 'leva'
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'

import { NavigationLayout } from '../components/layout/navigation-layout'

const WebGL = tunnel()

const Model = () => {
  const meshRef = useRef()
  const disp = useLoader(EXRLoader, '/textures/11.displacement.exr')
  const [map, textures] = useTexture(
    [
      '/textures/11.map.jpeg',
      '/textures/11.normal.png',
      '/textures/11.displacement.png'
    ],
    ([map, normal]) => {
      map.wrapS = THREE.RepeatWrapping
      map.wrapT = THREE.RepeatWrapping

      normal.matrixAutoUpdate = false
      // map.matrixAutoUpdate = false
      disp.matrixAutoUpdate = false
    }
  )
  const CONFIG = useControls({
    width: {
      min: 0,
      step: 0.1,
      value: 0.3,
      max: 2
    },
    height: {
      min: 0,
      step: 0.1,
      value: 4,
      max: 4
    },
    segments: {
      value: 512
    },
    displacementScale: {
      min: 0,
      step: 0.1,
      value: 2.7,
      max: 2.7
    },
    normalScale: {
      value: 3.4
    }
  })

  const scrollHeight = useMemo(() => document.documentElement.scrollHeight, [])

  useFrame(() => {
    const offset = ((scrollHeight - window.scrollY) / scrollHeight - 1) * 5
    disp.needsUpdate = false
    textures.needsUpdate = false
    map.offset.y = offset
    map.needsUpdate = true
  })

  return (
    <>
      <OrbitControls enableZoom={false} />
      <pointLight position={[0, -2, 2]} />
      <ambientLight />
      <mesh ref={meshRef} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry
          attach="geometry"
          args={[
            CONFIG.width,
            CONFIG.width,
            CONFIG.height,
            CONFIG.segments,
            CONFIG.segments,
            true
          ]}
        />
        <meshStandardMaterial
          map={map}
          displacementMap={disp}
          displacementScale={CONFIG.displacementScale}
          normalMap={textures}
          normalScale={CONFIG.normalScale}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  )
}

const MoveMapTexture = () => {
  return (
    <>
      <WebGL.In>
        <Model />
      </WebGL.In>
      <div style={{ height: '150vh' }} />
    </>
  )
}

MoveMapTexture.getLayout = ({ Component, title, description, slug }) => (
  <NavigationLayout slug={slug} description={description} title={title}>
    <div style={{ position: 'fixed', height: '100vh', width: '100vw' }}>
      <Canvas>
        <WebGL.Out />
      </Canvas>
    </div>

    <ScrollProvider>
      <Component />
    </ScrollProvider>
  </NavigationLayout>
)

MoveMapTexture.Title = 'Move map texture (In progress)'
MoveMapTexture.Description = (
  <p>
    Inspirated in{' '}
    <a href="https://www.zikd.space/en/">https://www.zikd.space/en/</a>
  </p>
)

export default MoveMapTexture
