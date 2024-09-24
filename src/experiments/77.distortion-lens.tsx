import {
  Image,
  MeshTransmissionMaterial,
  OrthographicCamera
} from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { easing } from 'maath'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { R3FSuspenseLayout } from '~/components/layout/r3f-suspense-layout'

const DistortionLens = () => {
  const circleRef = useRef<THREE.Mesh>(null)
  const gridImagesRef = useRef<THREE.Group>(null)

  const size = useThree((state) => state.size)
  const aspect = size.width / size.height

  useEffect(() => {
    // hide cursor
    document.body.style.cursor = 'none'
  }, [])

  useFrame(({ pointer, viewport }) => {
    if (!circleRef.current) return
    const x = (pointer.x * viewport.width) / 800
    const y = (pointer.y * viewport.height) / 800
    easing.damp(circleRef.current.position, 'x', x, 0.05, 0.016)
    easing.damp(circleRef.current.position, 'y', y, 0.05, 0.016)
    easing.damp(circleRef.current.position, 'z', 0, 0.05, 0.016)

    const grid = gridImagesRef.current
    if (!grid) return
    easing.damp(grid.position, 'x', x * 0.12 - 5, 0.1, 0.016)
    easing.damp(grid.position, 'y', y * 0.12 + 4, 0.1, 0.016)
  })

  const config = useControls({
    backside: { value: false, label: 'Backside' },
    backsideThickness: { value: 0.01, min: 0, max: 1, step: 0.01 },
    samples: { value: 4, min: 1, max: 32, step: 1 },
    resolution: { value: 2048, min: 256, max: 2048, step: 256 },
    transmission: { value: 1, min: 0, max: 1 },
    roughness: { value: 0.05, min: 0, max: 1, step: 0.01 },
    thickness: { value: 2.53, min: 0, max: 10, step: 0.01 },
    ior: { value: 1.13, min: 1, max: 5, step: 0.01 },
    chromaticAberration: { value: 0.02, min: 0, max: 1 },
    anisotropy: { value: 0.54, min: 0, max: 1, step: 0.01 },
    anisotropicBlur: { value: 0, min: 0, max: 1, step: 0.01 },
    distortion: { value: 0.17, min: 0, max: 1, step: 0.01 },
    distortionScale: { value: 0.1, min: 0.01, max: 1, step: 0.01 },
    temporalDistortion: { value: 0.0, min: 0, max: 1, step: 0.01 },
    clearcoat: { value: 0.0, min: 0, max: 1 },
    attenuationColor: '#ffffff',
    color: '#FFF'
  })

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 0, 20]}
        zoom={0.2}
        near={0.1}
        far={1000}
        left={-aspect}
        right={aspect}
        top={1}
        bottom={-1}
      />

      <group ref={gridImagesRef} position={[0, 0, 0]}>
        {Array.from({ length: 8 }).map((_, rowIndex) =>
          Array.from({ length: 3 }).map((_, colIndex) => (
            <Image
              key={`${rowIndex}-${colIndex}`}
              url={`https://picsum.photos/600/600?random=${
                rowIndex * 10 + colIndex
              }`}
              scale={[3, 4, 1]}
              position={[(rowIndex - 2) * 3.2, (colIndex - 2) * 4.2, 0]}
            />
          ))
        )}
      </group>
      <mesh ref={circleRef} position={[0, 0, 0.1]}>
        <sphereGeometry args={[3, 32, 32]} />
        <MeshTransmissionMaterial transmissionSampler {...config} />
      </mesh>
    </>
  )
}

DistortionLens.Layout = (props: any) => (
  <R3FSuspenseLayout
    gl={{
      antialias: false,
      autoClear: false,
      alpha: false,
      powerPreference: 'high-performance',
      outputColorSpace: THREE.SRGBColorSpace,
      toneMapping: THREE.NoToneMapping
    }}
    {...props}
  />
)

DistortionLens.Title = 'Distortion Lens'
DistortionLens.Description = ''

export default DistortionLens
