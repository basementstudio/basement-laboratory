import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { forwardRef, useRef } from 'react'
import * as THREE from 'three'

import { useIsomorphicLayoutEffect } from '~/hooks/use-isomorphic-layout-effect'

const Plane = forwardRef<THREE.Group>((_, ref) => {
  const plane = useGLTF('/models/plane.glb')
  const animations = useAnimations(plane.animations, plane.scene)
  const timeRef = useRef(0)

  useIsomorphicLayoutEffect(() => {
    const bodyAction = animations.actions['avio_body.001Action']
    const helixAction = animations.actions['avio_Helix.001Action']

    if (bodyAction && helixAction) {
      bodyAction.setLoop(THREE.LoopRepeat, Infinity)
      helixAction.setLoop(THREE.LoopRepeat, Infinity)

      bodyAction.reset().play()
      helixAction.reset().play()
    }
  }, [animations])

  useFrame((state, delta) => {
    if (!ref) return
    //@ts-ignore
    const planePos = ref.current.position
    if (planePos) {
      timeRef.current += delta

      const angle = -Math.PI * 0.25
      const forward = -timeRef.current * 16
      const newX =
        20 + Math.cos(angle) * forward + Math.sin(timeRef.current) * 1.2
      const newZ = -25 + Math.sin(angle) * forward

      const distanceFromCamera = new THREE.Vector3(
        newX,
        planePos.y,
        newZ
      ).distanceTo(state.camera.position)

      if (distanceFromCamera > 55) {
        timeRef.current = 0
        planePos.x = 20
        planePos.z = -26
      } else {
        planePos.x = newX
        planePos.z = newZ
      }
    }
  })

  return (
    <>
      <primitive
        ref={ref}
        scale={0.5}
        position={[20, 3.5, -26]}
        rotation={[0, -Math.PI * 0.25, 0]}
        object={plane.scene}
      />
    </>
  )
})

export default Plane
