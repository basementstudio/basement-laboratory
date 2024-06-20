import { OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import { useFrame, useLoader as useThreeLoader } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useMemo } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  ShaderMaterial
} from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { GLTF } from 'three-stdlib'

import { R3FSuspenseLayout } from '~/components/layout/r3f-suspense-layout'

const TOTAL_FRAMES = 212

const flagVertexShader = /* glsl */ `

  const float PI = 3.1415926535897932384626433832795;

  uniform sampler2D tDisplacement;
  uniform float vertexCount;
  uniform float currentFrame;
  uniform float offsetScale;
  uniform float totalFrames;

  attribute float vertexNumber;


  varying vec2 vDisplacementUv;
  varying vec3 displacement;
  varying vec2 vUv;
  varying vec3 vNormal;

  // the X axis indicates the vertex and the Y axis, the current frame
  vec2 getFrameUv(float frame) {
    return vec2(
      vertexNumber / vertexCount,
      1. - frame / totalFrames
    );
  }

  vec2 rotateVector(vec2 v, vec2 origin, float angle) {
    float s = sin(angle);
    float c = cos(angle);

    // translate point back to origin:
    v -= origin;

    // rotate point
    vec2 newV = vec2(
      v.x * c - v.y * s,
      v.x * s + v.y * c
    );

    // translate point back:
    return newV + origin;

  }

  void main() {
    vUv = rotateVector(uv, vec2(0.5), PI * -0.5);
    vDisplacementUv = getFrameUv(currentFrame);
    vec3 offset = texture2D(tDisplacement, vDisplacementUv).xzy;
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

  void main() {
    vec3 color = texture2D(tColor, vUv).xyz;

    float displacementF = clamp(length(displacement), 0., 0.8);
    color *= 1. - displacementF;
    

    gl_FragColor = vec4(color, 1.);
  }
`

interface FlagGlTFResult extends GLTF {
  nodes: {
    Plane002: THREE.Mesh
  }
}

function addVertexNumberAttribute(geometry: BufferGeometry) {
  const vertexCount = geometry.attributes.position.count

  const vertexNumbers = new Float32Array(vertexCount)

  for (let i = 0; i < vertexCount; i++) {
    vertexNumbers[i] = i
  }

  geometry.setAttribute('vertexNumber', new BufferAttribute(vertexNumbers, 1))
}

const VertexAnimationTexture = () => {
  const { nodes } = useGLTF(
    `/models/flag/flag.glb`
  ) as unknown as FlagGlTFResult

  const t = useThreeLoader(EXRLoader, `/models/flag/offsets.exr`)
  const flagTexture = useTexture(`/models/flag/bandera-argentina.png`)

  useEffect(() => {
    // entend the image with closes pixel
    // t.wrapS = t.wrapT = 1002
    // t.anisotropy = 64
    // t.magFilter = NearestFilter
  }, [t])

  const { flag, flagMaterial } = useMemo(() => {
    const flag = nodes.Plane002.clone() as THREE.Mesh
    addVertexNumberAttribute(flag.geometry as BufferGeometry)
    const flagMaterial = new ShaderMaterial({
      side: DoubleSide,
      vertexShader: flagVertexShader,
      fragmentShader: flagFragmentShader,
      uniforms: {
        tDisplacement: { value: t },
        tColor: { value: flagTexture },
        vertexCount: { value: flag.geometry.attributes.position.count },
        currentFrame: { value: 0 },
        offsetScale: { value: 1 },
        totalFrames: { value: TOTAL_FRAMES }
      }
    })

    flag.material = flagMaterial

    return {
      flag,
      flagMaterial
    } as const
  }, [nodes, t, flagTexture])

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

  useFrame(({ clock }) => {
    if (play) {
      flagMaterial.uniforms.currentFrame.value =
        (clock.getElapsedTime() * 30) % TOTAL_FRAMES
    }
  })

  return (
    <>
      <color attach="background" args={['#222']} />
      <OrbitControls />
      <mesh position={[0, -4, 0]}>
        <cylinderGeometry args={[0.01, 0.06, 10]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <group position={[2, -0.1, 0]}>
        <primitive object={flag} />
      </group>
    </>
  )
}

VertexAnimationTexture.Layout = R3FSuspenseLayout

VertexAnimationTexture.Title = 'Vertex animation texture'
VertexAnimationTexture.Description =
  'Animate soft bodies using a displacement texture.'

export default VertexAnimationTexture
