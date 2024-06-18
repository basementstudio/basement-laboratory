import { OrbitControls, useGLTF } from '@react-three/drei'
import { useLoader as useThreeLoader } from '@react-three/fiber'
import { useMemo } from 'react'
import { DoubleSide, ShaderMaterial } from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { GLTF } from 'three-stdlib'

import { R3FSuspenseLayout } from '~/components/layout/r3f-suspense-layout'

const flagVertexShader = /* glsl */ `
  uniform sampler2D tFlag;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 offset = texture2D(tFlag, vUv).xyz * 0.;
    vec3 newPosition = position + offset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

const flagFragmentShader = /* glsl */ `
  uniform sampler2D tFlag;

  varying vec2 vUv;

  void main() {
    vec3 col = texture2D(tFlag, vUv).xyz;
    gl_FragColor = vec4(col, 1.0);
  }
`

interface FlagGlTFResult extends GLTF {
  nodes: {
    Plane002: THREE.Mesh
  }
}

const VertexAnimationTexture = () => {
  const { nodes } = useGLTF(
    `/models/flag/flag.glb`
  ) as unknown as FlagGlTFResult

  const t = useThreeLoader(EXRLoader, `/models/flag/offsets.exr`)

  const { flag } = useMemo(() => {
    const flagMaterial = new ShaderMaterial({
      side: DoubleSide,
      vertexShader: flagVertexShader,
      fragmentShader: flagFragmentShader,
      uniforms: {
        tFlag: { value: t }
      }
    })

    const flag = nodes.Plane002.clone() as THREE.Mesh
    flag.material = flagMaterial

    return {
      flag
    } as const
  }, [nodes, t])

  return (
    <>
      <color attach="background" args={['#f0f0f0']} />
      <OrbitControls />
      <primitive object={flag} />
    </>
  )
}

VertexAnimationTexture.Layout = R3FSuspenseLayout

// VertexAnimationTexture.Layout = HTMLLayout
VertexAnimationTexture.Title = 'Vertex animation texture'
VertexAnimationTexture.Description =
  'Animate soft bodies using a displacement texture.'

export default VertexAnimationTexture
