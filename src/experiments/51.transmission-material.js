import {
  Environment,
  Float,
  MeshTransmissionMaterial,
  PerspectiveCamera,
  useGLTF,
  // useTexture
} from '@react-three/drei'
import { useControls } from 'leva'
import React from 'react'

const TransmissionMaterial = () => {
  const { nodes } = useGLTF('/models/lente.glb')
  // const environment = useTexture('/textures/environment.jpg')

  const config = useControls({
    meshPhysicalMaterial: false,
    transmissionSampler: false,
    backside: false,
    samples: { value: 10, min: 1, max: 32, step: 1 },
    resolution: { value: 2048, min: 256, max: 2048, step: 256 },
    transmission: { value: 1, min: 0, max: 1 },
    roughness: { value: 0.0, min: 0, max: 1, step: 0.01 },
    thickness: { value: 3.5, min: 0, max: 10, step: 0.01 },
    ior: { value: 1.14, min: 1, max: 5, step: 0.01 },
    chromaticAberration: { value: 0.04, min: 0, max: 1 },
    anisotropy: { value: 0.1, min: 0, max: 1, step: 0.01 },
    distortion: { value: 0.0, min: 0, max: 1, step: 0.01 },
    distortionScale: { value: 0.3, min: 0.01, max: 1, step: 0.01 },
    temporalDistortion: { value: 0.5, min: 0, max: 1, step: 0.01 },
    attenuationDistance: { value: 0.5, min: 0, max: 10, step: 0.01 },
    attenuationColor: '#ffffff'
    // color: '#c9ffa1',
    // bg: '#839681'
  })
  
  return (
    <>
      {/* <axesHelper />
      <gridHelper /> */}
      <Environment
        files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr"
        blur={10}
      />

      {/* <OrbitControls /> */}
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />

      <Float>
        <mesh
          position={[-0.6813273468623589, 0.43534952155608375, 1]}
          geometry={nodes.Cylinder001_1.geometry}
          scale={[0.5, 0.5, 0.25]}
          rotation={[-0.4, -0.35, 0]}
        >
          <MeshTransmissionMaterial {...config} />
        </mesh>
      </Float>

      <Float>
        <mesh
          scale={[1, 1, 0.5]}
          rotation={[-0.6, -0.8, 0]}
          geometry={nodes.Cylinder001_1.geometry}
        >
          <MeshTransmissionMaterial {...config} />
        </mesh>
      </Float>
    </>
  )
}

TransmissionMaterial.Title = "Drei's Transmision Material Tests"

export default TransmissionMaterial
