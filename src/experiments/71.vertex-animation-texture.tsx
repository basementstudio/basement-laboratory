import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Sky,
  useGLTF,
  useMatcapTexture,
  useTexture
} from '@react-three/drei'
import {
  GroupProps,
  useFrame,
  useLoader as useThreeLoader
} from '@react-three/fiber'
import { useControls } from 'leva'
import { useMemo, useRef } from 'react'
import { DoubleSide, ShaderMaterial } from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { GLTF } from 'three-stdlib'

import { R3FSuspenseLayout } from '~/components/layout/r3f-suspense-layout'

// height on pixels of the animation texture
const TOTAL_FRAMES = 214

const flagVertexShader = /* glsl */ `

  const float PI = 3.1415926535897932384626433832795;

  uniform sampler2D tDisplacement;
  uniform sampler2D tNormals;
  uniform float vertexCount;
  uniform float currentFrame;
  uniform float offsetScale;
  uniform float totalFrames;

  attribute vec2 uv1; //added attribute for displacement texture

  varying vec2 vDisplacementUv;
  varying vec3 displacement;
  varying vec2 vUv;
  varying vec3 vNormal;
  
  void main() {
    vUv = vec2(uv.x, 1. - uv.y);
    vDisplacementUv = vec2(uv1.x, 1. - (currentFrame / totalFrames));
    vec3 offset = texture2D(tDisplacement, vDisplacementUv).xzy;
    vNormal = texture2D(tNormals, vDisplacementUv).xyz;
    displacement = offset;
    offset *= offsetScale;
    vec3 newPosition = position + offset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

const flagFragmentShader = /* glsl */ `
  uniform sampler2D tDisplacement;
  uniform sampler2D tColor;

  varying vec2 vUv;
  varying vec2 vDisplacementUv;
  varying vec3 displacement;
  varying vec3 vNormal;

  void main() {
    vec3 color = texture2D(tColor, vUv).xyz;
    vec3 normal = normalize(vNormal);
    vec3 lightDirection = normalize(vec3(0.5, 0.5, 1.));
    float light = dot(normal, lightDirection);
    color *= light;

    gl_FragColor = vec4(color, 1.);
  }
`

// Type the GLTF nodes to use later
interface FlagGlTFResult extends GLTF {
  nodes: {
    export_mesh: THREE.Mesh
  }
}

interface MastilGlTFResult extends GLTF {
  nodes: {
    sm_mastil: THREE.Mesh
  }
}

interface BaseGlTFResult extends GLTF {
  nodes: {
    sm_base: THREE.Mesh
  }
}

interface FlagProps extends GroupProps {
  texture?: string
  animationOffset?: number
}

const Flag = ({
  texture = 'bandera-argentina.png',
  animationOffset = 0,
  ...props
}: FlagProps) => {
  const { nodes } = useGLTF(
    `/models/flag/Bandera3.glb`
  ) as unknown as FlagGlTFResult

  const { nodes: mastilNodes } = useGLTF(
    `/models/flag/Mastil.glb`
  ) as unknown as MastilGlTFResult

  const t = useThreeLoader(EXRLoader, `/models/flag/offsets_DWAA.exr`)
  const n = useTexture(`/models/flag/normals.png`)
  const flagTexture = useTexture(`/models/flag/${texture}`)

  const { flag, flagMaterial, mastil } = useMemo(() => {
    const flag = nodes.export_mesh.clone() as THREE.Mesh
    const flagMaterial = new ShaderMaterial({
      side: DoubleSide,
      vertexShader: flagVertexShader,
      fragmentShader: flagFragmentShader,
      uniforms: {
        tDisplacement: { value: t },
        tNormals: { value: n },
        tColor: { value: flagTexture },
        vertexCount: { value: flag.geometry.attributes.position.count },
        currentFrame: { value: 0 },
        offsetScale: { value: 1 },
        totalFrames: { value: TOTAL_FRAMES }
      }
    })

    flag.material = flagMaterial

    const mastil = mastilNodes.sm_mastil.clone() as THREE.Mesh

    return {
      flag,
      flagMaterial,
      mastil
    } as const
  }, [nodes, t, flagTexture, n, mastilNodes])

  const [{ play }] = useControls(() => ({
    play: {
      value: true
    },
    offsetScale: {
      value: flagMaterial.uniforms.offsetScale.value,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (value: number) => {
        flagMaterial.uniforms.offsetScale.value = value
      }
    }
  }))

  const progressRef = useRef(0)

  useFrame((_, delta) => {
    if (play) {
      progressRef.current += delta
      flagMaterial.uniforms.currentFrame.value =
        (progressRef.current * 24 + animationOffset) % TOTAL_FRAMES
    }
  })

  const [matcap] = useMatcapTexture('555555_C8C8C8_8B8B8B_A4A4A4')

  return (
    <group {...props}>
      <group rotation={[0, Math.PI * -0.5, 0]} position={[0, 0, 0]}>
        <primitive object={flag} />
      </group>
      <primitive object={mastil}>
        <meshMatcapMaterial matcap={matcap} />
      </primitive>
    </group>
  )
}

const VertexAnimationTexture = () => {
  const { nodes: baseNodes } = useGLTF(
    `/models/flag/Base.glb`
  ) as unknown as BaseGlTFResult

  return (
    <>
      <OrbitControls target={[0, 4.5, 0]} />

      <PerspectiveCamera makeDefault position={[5, 2, 5]} />

      <Environment preset="city" />
      <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0}
        azimuth={0.25}
      />

      <group rotation={[0, Math.PI * -0.5, 0]}>
        <primitive object={baseNodes.sm_base}>
          <meshStandardMaterial color="#ccc" />
        </primitive>
      </group>
      {Array.from({ length: 7 }).map((_, i) => (
        <Flag
          texture={i % 2 ? 'bandera-basement.png' : 'bandera-argentina.png'}
          key={i}
          animationOffset={i * 30}
          position={[0, 0, i * -1.94]}
        />
      ))}
    </>
  )
}

VertexAnimationTexture.Layout = R3FSuspenseLayout

VertexAnimationTexture.Title = 'Vertex animation texture'
VertexAnimationTexture.Description =
  'Animate soft bodies using a displacement texture.'

export default VertexAnimationTexture
