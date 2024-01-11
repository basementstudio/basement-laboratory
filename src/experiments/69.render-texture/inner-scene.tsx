import { PerspectiveCamera } from '@react-three/drei'
import { useRef } from 'react'

import { useTextureFrame } from './render-texture'

export const InnerScene = () => {
  const groupRef = useRef<THREE.Group>(null)

  useTextureFrame(({ delta }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += 1 * delta
  })

  return (
    <>
      <color attach="background" args={['#faf']} />
      <ambientLight intensity={2} />
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />

      <group ref={groupRef}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
    </>
  )
}
