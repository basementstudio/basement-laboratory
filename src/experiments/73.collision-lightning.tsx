import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import {
  Environment,
  MeshReflectorMaterial,
  PerspectiveCamera,
  Text3D
} from '@react-three/drei'
import { BallCollider, Physics, RigidBody } from '@react-three/rapier'
import { folder, useControls } from 'leva'
import { R3FSuspenseLayout } from '~/components/layout/r3f-suspense-layout'
import { gsap } from 'lib/gsap/index'
import { Bloom, EffectComposer } from '@react-three/postprocessing'

type TConfig = {
  emissive: string
  text: string
  minForce: number
  forceIntensity: number
}

interface GlyphProps {
  letter: string
  config: TConfig
}

const Glyph = ({ letter, config }: GlyphProps) => {
  const r = THREE.MathUtils.randFloatSpread
  const api = useRef<any>(null)
  const pos = useMemo(() => new THREE.Vector3(r(10), r(10), r(10)), [r])
  const rot = useMemo(() => new THREE.Euler(r(10), r(10), r(10)), [r])

  useFrame((_state, delta) => {
    delta = Math.min(0.01, delta)
    if (api.current) {
      api.current.applyImpulse(
        new THREE.Vector3()
          .copy(api.current.translation())
          .negate()
          .multiplyScalar(0.02)
      )
    }
  })

  return (
    <>
      <RigidBody
        linearDamping={5}
        angularDamping={1}
        friction={0.1}
        position={pos}
        rotation={rot}
        ref={api}
        onContactForce={(payload: any) => {
          const { totalForceMagnitude } = payload

          if (totalForceMagnitude > config.minForce) {
            const objMaterial =
              payload.target.rigidBodyObject?.children[0].material
            if (objMaterial) {
              const intensity =
                (totalForceMagnitude * config.forceIntensity) / 1000
              gsap
                .timeline()
                .to(objMaterial, {
                  emissiveIntensity: intensity,
                  duration: 0.4
                })
                .to(objMaterial, {
                  emissiveIntensity: 0,
                  delay: 1,
                  duration: 0.8
                })
            }
          }
        }}
      >
        <Text3D
          size={0.8}
          font="/fonts/grotesque/BasementGrotesqueRoman_Bold.json"
          bevelEnabled={true}
          bevelThickness={0.1}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={5}
        >
          {letter}
          <meshPhysicalMaterial {...config} emissiveIntensity={0} />
        </Text3D>
      </RigidBody>
    </>
  )
}

const Repeller = ({ vec = new THREE.Vector3() }) => {
  const ref = useRef<any>()
  useFrame(({ pointer, viewport }) => {
    ref.current?.setNextKinematicTranslation(
      vec.set(
        (pointer.x * viewport.width) / 2,
        (pointer.y * viewport.height) / 2,
        0
      )
    )
  })
  return (
    <RigidBody
      position={[0, 0, 0]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[0.5]} />
    </RigidBody>
  )
}

const CollisionLightning = () => {
  const config = useControls({
    lighting: folder({
      emissive: '#ff4d00',
      text: 'BSMNT',
      minForce: { value: 190, min: 100, max: 1000, step: 10 },
      forceIntensity: { value: 2.6, min: 1, max: 3, step: 0.1 }
    }),
    material: folder(
      {
        transmissionSampler: false,
        backside: false,
        samples: { value: 10, min: 1, max: 32, step: 1 },
        resolution: { value: 2048, min: 256, max: 2048, step: 256 },
        transmission: { value: 1, min: 0, max: 1 },
        roughness: { value: 0.0, min: 0, max: 1, step: 0.01 },
        thickness: { value: 3.5, min: 0, max: 10, step: 0.01 },
        ior: { value: 1.5, min: 1, max: 5, step: 0.01 },
        chromaticAberration: { value: 0.06, min: 0, max: 1 },
        anisotropy: { value: 0.1, min: 0, max: 1, step: 0.01 },
        distortion: { value: 0.0, min: 0, max: 1, step: 0.01 },
        distortionScale: { value: 0.3, min: 0.01, max: 1, step: 0.01 },
        temporalDistortion: { value: 0.5, min: 0, max: 1, step: 0.01 },
        clearcoat: { value: 1, min: 0, max: 1 },
        attenuationDistance: { value: 0.5, min: 0, max: 10, step: 0.01 },
        attenuationColor: '#ffffff',
        color: '#ffffff'
      },
      { collapsed: true }
    )
  })

  const WORD = config.text
  const LETTERS = WORD.split('')

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 18]} fov={20} />
      <Environment preset="night" />
      <Physics gravity={[0, 0, 0]}>
        {LETTERS.map((letter, i) => (
          <Glyph key={i} letter={letter} config={config} />
        ))}
        <Repeller />
      </Physics>
      <mesh receiveShadow position={[0, 0, -8]}>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          resolution={1024}
          mixStrength={30}
          roughness={0.3}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#202020"
          metalness={1}
          mirror={2}
        />
      </mesh>
      {/* <EffectComposer>
        <Bloom intensity={0.7} />
      </EffectComposer> */}
    </>
  )
}

CollisionLightning.Layout = R3FSuspenseLayout

CollisionLightning.Title = 'Collision lightning'
CollisionLightning.Description =
  'Animate lighning based on collision between objects'

export default CollisionLightning
