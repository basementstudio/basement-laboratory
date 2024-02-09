import { OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

type GLTFResult = GLTF & {
  nodes: {
    Plane: THREE.Mesh
  }
  materials: Record<any, any>
}

const HarveyHero = () => {
  const modelRef = useRef<THREE.Mesh>()
  const { nodes } = useGLTF(
    '/models/71.plane-shapekeys-low.glb'
  ) as unknown as GLTFResult
  const texture = useTexture('/textures/71.512-low.png', (texture) => {
    const t = texture as THREE.Texture
    t.repeat = new THREE.Vector2(84, 84)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.minFilter = t.magFilter = THREE.NearestFilter
  })

  useFrame((state) => {
    if (modelRef.current) {
      // @ts-ignore
      modelRef.current.material.map.offset.x -= 0.01
      // @ts-ignore
      modelRef.current.material.map.offset.y += 0.01

      const time = state.clock.getElapsedTime()
      const frequency = 0.025
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      modelRef.current.morphTargetInfluences![0] =
        0.5 * (1 + Math.sin(2 * Math.PI * frequency * time))
    }
  })

  return (
    <>
      <OrbitControls />

      <ambientLight intensity={3} />

      <group dispose={null}>
        <mesh
          ref={modelRef}
          rotation={[0, -Math.PI / 1.6, 0]}
          name="Plane"
          castShadow
          receiveShadow
          geometry={nodes.Plane.geometry}
          material={nodes.Plane.material}
          morphTargetDictionary={nodes.Plane.morphTargetDictionary}
          morphTargetInfluences={nodes.Plane.morphTargetInfluences}
        >
          <meshStandardMaterial map={texture} color="white" />
        </mesh>
      </group>
    </>
  )
}

HarveyHero.Title = 'Abstract geometric waves in motion'
HarveyHero.Description = <></>
HarveyHero.Layout = (props: any) => (
  <>
    <div
      style={{
        backgroundColor: '#F9FAFB',
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      <R3FCanvasLayout
        gl={{
          antialias: false,
          autoClear: false,
          alpha: false,
          powerPreference: 'high-performance',
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.NoToneMapping
        }}
        camera={{
          position: [0, 0, 1],
          near: 0.1,
          far: 10
        }}
        {...props}
      />
    </div>
  </>
)
HarveyHero.Tags = 'private'

export default HarveyHero
