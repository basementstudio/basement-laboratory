import {
  Environment,
  Float,
  MeshTransmissionMaterial,
  PerspectiveCamera,
  useGLTF,
  useTexture
} from '@react-three/drei'
import { useControls } from 'leva'
import React from 'react'

const ScaleTransmissionMaterial = () => {
  const { nodes } = useGLTF('/models/hero-scale.gltf')
  const roughnessMap = useTexture('/textures/dirtness.jpg')

  // const texture = useTexture('/images/matcap/CL-107.png')`

  const config = useControls({
    meshPhysicalMaterial: false,
    transmissionSampler: false,
    backside: false,
    samples: { value: 10, min: 1, max: 32, step: 1 },
    resolution: { value: 2048, min: 256, max: 2048, step: 256 },
    transmission: { value: 1, min: 0, max: 1 },
    roughness: { value: 0.0, min: 0, max: 1, step: 0.01 },
    thickness: { value: 4, min: 0, max: 10, step: 0.01 },
    ior: { value: 2.0, min: 1, max: 5, step: 0.01 },
    chromaticAberration: { value: 1.0, min: 0, max: 1 },
    anisotropy: { value: 0.4, min: 0, max: 1, step: 0.01 },
    distortion: { value: 0.59, min: 0, max: 1, step: 0.01 },
    distortionScale: { value: 0.65, min: 0.01, max: 1, step: 0.01 },
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
      <Environment files="/images/hdr-color.hdr" blur={20} />

      {/* <OrbitControls /> */}
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
      <Float>
        <group
          dispose={null}
          scale={0.005}
          position={[-2.5798447167456664, 0.6446532527416567, 0]}
          rotation={[1.5740385863957922, 0.0614651832823787, 0]}
        >
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Top.geometry}
            position={[88.96, 407.41, -296.84]}
            rotation={[-0.74, 0.4, -2.73]}
          >
            <MeshTransmissionMaterial {...config} roughnessMap={roughnessMap} />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Middle.geometry}
            position={[377.31, 407.41, -112.79]}
            rotation={[-0.22, -0.49, 0.91]}
          >
            <MeshTransmissionMaterial {...config} roughnessMap={roughnessMap} />
            {/* <meshMatcapMaterial matcap={texture} /> */}
          </mesh>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Bottom.geometry}
            position={[723.95, 407.41, 479.25]}
            rotation={[-1.19, 0.38, -2.66]}
          >
            <MeshTransmissionMaterial {...config} roughnessMap={roughnessMap} />
            {/* <meshMatcapMaterial matcap={texture} /> */}
          </mesh>
        </group>
      </Float>
    </>
  )
}

ScaleTransmissionMaterial.Title = 'Scale Transmision Material Hero'
ScaleTransmissionMaterial.Tags = 'Transmision'

export default ScaleTransmissionMaterial
