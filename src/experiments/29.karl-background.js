import { Center, Environment, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'

import { Loader, useLoader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

import { DURATION, gsap } from '../lib/gsap'
import { trackCursor } from '../lib/three'

const MODEL_NAME = 'KJ_Web_Scene.glb'
const config = {
  scale: 0.6,
  ambientLight: 0.1,
  background: '#000',
  environment: 'sunset',
  camXPosition: -2,
  camYPosition: 25,
  camZPosition: 18,
  camXRotation: -Math.PI / 2.8,
  camYRotation: 0,
  camZRotation: 0
}

const KarlBg = () => {
  const cardsRef = useRef([])
  const { camera } = useThree()
  const setLoaded = useLoader((s) => s.setLoaded)
  const model = useGLTF(
    `/models/${MODEL_NAME}`,
    undefined,
    undefined,
    (loader) => {
      loader.manager.onLoad = () => setLoaded()
    }
  )

  useLayoutEffect(() => {
    if (!model || !camera) return

    camera.position.set(
      config.camXPosition,
      config.camYPosition,
      config.camZPosition
    )
    camera.rotation.set(
      config.camXRotation,
      config.camYRotation,
      config.camZRotation
    )

    /* Cards hover */
    const cards = model.scene.children.find((o) => o.name === 'Cards')
    cardsRef.current = cards.children

    /* Floor size */
    const floorScaleFactor = 3
    const floor = model.scene.children.find((o) => o.name === 'Plane')
    floor.scale.set(floorScaleFactor, floorScaleFactor, floorScaleFactor)
    floor.material.map.repeat.set(floorScaleFactor, floorScaleFactor)

    const mouseTracker = trackCursor((cursor) => {
      gsap.to(camera.rotation, {
        overwrite: true,
        duration: DURATION / 2.5,
        x: config.camXRotation + cursor.y * (Math.PI / 10),
        y: config.camYRotation + -cursor.x * (Math.PI / 20),
        ease: 'power2.out'
      })
    })

    return () => {
      mouseTracker.destroy()
    }
  }, [camera, model])

  // useFrame((st) => {
  // const intersecting = raycaster.intersectObjects(cardsRef.current)
  // intersecting[0]?.object?.scale?.set?.(2, 2, 2)
  // })

  return (
    <>
      {/* <fog attach="fog" args={['#17171b', 70, 80]} /> */}

      <color attach="background" args={[config.background]} />
      {/* @ts-ignore */}
      <Environment preset={config?.environment} />
      <ambientLight intensity={config?.ambientLight} />
      {/* <OrbitControls /> */}

      <Center>
        <group scale={config?.scale}>
          {/* @ts-ignore */}
          <primitive object={model.scene} />
        </group>
      </Center>
    </>
  )
}

KarlBg.Layout = (props) => (
  <R3FCanvasLayout {...props} htmlChildren={<Loader />} />
)
KarlBg.Title = 'Karl Background'
KarlBg.Tags = '3d,private'

export default KarlBg
