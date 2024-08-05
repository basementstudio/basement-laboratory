import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import {
  Environment,
  MeshReflectorMaterial,
  PerspectiveCamera,
  Text3D
} from '@react-three/drei'
import {
  BallCollider,
  ContactForcePayload,
  Physics,
  RigidBody
} from '@react-three/rapier'
import { folder, useControls } from 'leva'
import { R3FSuspenseLayout } from '~/components/layout/r3f-suspense-layout'
import { gsap } from 'lib/gsap/index'
import { useDeviceDetect } from '~/hooks/use-device-detect'

type TConfig = {
  emissive: string
  text: string
  minForce: number
  forceIntensity: number
  transmissionSampler: boolean
  backside: boolean
  samples: number
  resolution: number
  transmission: number
  roughness: number
  thickness: number
  ior: number
  chromaticAberration: number
  anisotropy: number
  distortion: number
  distortionScale: number
  temporalDistortion: number
  clearcoat: number
  attenuationDistance: number
  attenuationColor: string
  color: string
}

interface GlyphProps {
  letter: string
  config: TConfig
  isMobile: boolean | undefined
}

const Glyph = ({ letter, config, isMobile }: GlyphProps) => {
  if (isMobile === undefined) return
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
        onContactForce={(payload: ContactForcePayload) => {
          const { totalForceMagnitude } = payload

          if (totalForceMagnitude > config.minForce) {
            const objMaterial = (
              payload.target.rigidBodyObject?.children[0] as THREE.Mesh
            ).material
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
          {isMobile ? (
            <meshLambertMaterial
              color="#fff"
              emissive={config.emissive}
              emissiveIntensity={0}
            />
          ) : (
            <meshPhysicalMaterial {...config} emissiveIntensity={0} />
          )}
        </Text3D>
      </RigidBody>
    </>
  )
}

const Repeller = ({
  size,
  isMobile
}: {
  size: number
  isMobile: boolean | undefined
}) => {
  const ref = useRef<any>()
  const vec = new THREE.Vector3()
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 })

  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    setTouchPosition({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0]
    setTouchPosition({ x: touch.clientX, y: touch.clientY })
  }

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  useFrame(({ viewport, pointer }, delta) => {
    if (isMobile) {
      ref.current?.setNextKinematicTranslation(
        vec.set(
          (touchPosition.x / window.innerWidth) * viewport.width -
            viewport.width / 2,
          -(touchPosition.y / window.innerHeight) * viewport.height +
            viewport.height / 2,
          0
        )
      )
    } else {
      delta = Math.min(0.01, delta)
      if (ref.current) {
        ref.current?.setNextKinematicTranslation(
          vec.set(
            (pointer.x * viewport.width) / 2,
            (pointer.y * viewport.height) / 2,
            0
          )
        )
      }
    }
  })

  return (
    <RigidBody
      position={[0, 0, 0]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[size]} />
    </RigidBody>
  )
}

const CollisionLightning = () => {
  const { isMobile } = useDeviceDetect()

  const config = useControls({
    debug: false,
    lighting: folder({
      emissive: '#ff4d00',
      text: 'BSMNT',
      minForce: { value: isMobile ? 100 : 190, min: 100, max: 1000, step: 10 },
      forceIntensity: { value: 2.6, min: 1, max: 3, step: 0.1 },
      repellerSize: { value: 0.5, min: 0.1, max: 5, step: 0.1 }
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
      <ambientLight color={config.emissive} intensity={0.5} />
      <PerspectiveCamera makeDefault position={[0, 0, 18]} fov={20} />
      <Environment preset="night" />
      <Physics gravity={[0, 0, 0]} debug={config.debug}>
        {LETTERS.map((letter, i) => (
          <Glyph key={i} letter={letter} config={config} isMobile={isMobile} />
        ))}
        <Repeller size={config.repellerSize} isMobile={isMobile} />
      </Physics>
      <mesh receiveShadow position={[0, 0, -6]}>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          resolution={isMobile ? 512 : 1024}
          mixStrength={isMobile ? 15 : 30}
          roughness={0.3}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#202020"
          metalness={1}
          mirror={2}
        />
      </mesh>
    </>
  )
}

CollisionLightning.Layout = R3FSuspenseLayout

CollisionLightning.Title = 'Collision lightning'
CollisionLightning.Description =
  'Animate lighning based on collision between objects'

export default CollisionLightning
