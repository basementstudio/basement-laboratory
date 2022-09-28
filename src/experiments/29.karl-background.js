import { Center, Environment, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useLayoutEffect, useRef } from 'react'

import { Loader, useLoader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

import { DURATION, gsap } from '../lib/gsap'
import { trackCursor } from '../lib/three'

const MODEL_NAME = 'KJ_Web_Scene.glb'

const KarlBg = () => {
  const modelRef = useRef(null)
  const cardsRef = useRef([])
  const { camera } = useThree()
  const setLoaded = useLoader((s) => s.setLoaded)
  const config = useControls({
    scale: { value: 0.6, step: 0.01, min: 0, max: 2 },
    ambientLight: { value: 0.1, step: 0.01, min: 0, max: 2 },
    ambientLightColor: { value: '#fff' },
    background: { value: '#000' },
    environment: { value: 'sunset' },
    camXPosition: { value: -2, step: 0.5, min: -10, max: 10 },
    camYPosition: { value: 17, step: 0.5, min: 0, max: 30 },
    camZPosition: { value: 18, step: 0.5, min: 0, max: 30 },
    camXRotation: {
      value: -Math.PI / 2.8,
      min: -Math.PI * 2,
      max: Math.PI * 2
    },
    camYRotation: { value: 0, min: -Math.PI * 2, max: Math.PI * 2 },
    camZRotation: { value: 0, min: -Math.PI * 2, max: Math.PI * 2 },
    camRotationMultiplierX: { value: 0.05, min: 0, max: 1 },
    camRotationMultiplierY: { value: 0.05, min: 0, max: 1 }
  })
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
    const floorScaleFactor = 50
    const floor = model.scene.children.find((o) => o.name === 'Plane')
    floor.scale.set(floorScaleFactor, floorScaleFactor, floorScaleFactor)
    floor.material.map.repeat.set(floorScaleFactor, floorScaleFactor)

    const mouseTracker = trackCursor((cursor) => {
      gsap.to(camera.rotation, {
        overwrite: true,
        duration: DURATION / 2.5,
        x:
          config.camXRotation +
          cursor.y * (Math.PI * config.camRotationMultiplierX) +
          Math.PI * 0.025,
        y:
          config.camYRotation +
          -cursor.x * (Math.PI * config.camRotationMultiplierY),
        ease: 'power2.out'
      })
    })

    return () => {
      mouseTracker.destroy()
    }
  }, [camera, model, config])

  // useFrame((st) => {
  // const intersecting = raycaster.intersectObjects(cardsRef.current)
  // intersecting[0]?.object?.scale?.set?.(2, 2, 2)
  // })

  return (
    <>
      <color attach="background" args={[config.background]} />
      <Environment preset={config?.environment} />
      <ambientLight
        intensity={config?.ambientLight}
        color={config.ambientLightColor}
      />
      {/* <OrbitControls /> */}

      <Center>
        <group scale={config?.scale}>
          {/* @ts-ignore */}
          <primitive object={model.scene} ref={modelRef} />
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
