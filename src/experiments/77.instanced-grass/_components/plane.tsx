import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

import { useIsomorphicLayoutEffect } from '~/hooks/use-isomorphic-layout-effect'

export default function Plane() {
  const plane = useGLTF('/models/plane.glb')
  const animations = useAnimations(plane.animations, plane.scene)

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

  return (
    <>
      <primitive
        scale={0.5}
        position={[-6, 4, -3]}
        rotation={[0, -Math.PI * 0.25, 0]}
        object={plane.scene}
      />
    </>
  )
}
