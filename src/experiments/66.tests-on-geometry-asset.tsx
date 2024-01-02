import {
  OrbitControls,
  OrthographicCamera,
  Stats,
  useGLTF,
  View
} from '@react-three/drei'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { Physics, RapierRigidBody, RigidBody, vec3 } from '@react-three/rapier'
import { useControls } from 'leva'
import { range } from 'lodash'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
// @ts-ignore
import { MeshLine, MeshLineMaterial } from 'three.meshline'
import { GLTF } from 'three-stdlib'

import { HTMLLayout } from '~/components/layout/html-layout'

extend({ MeshLine, MeshLineMaterial })

type GLTFResult = GLTF & {
  nodes: {
    cross: THREE.Mesh
    ['cross-edges']: THREE.Mesh
  }
}

type TankProps = {
  crossMaterial: THREE.Material
  count?: number
}

const Tank = ({ crossMaterial, count = 10 }: TankProps) => {
  /* Listen to camera changes, fsr it breaks if I remove it */
  useThree((s) => s.camera)

  const width = useThree((s) => s.viewport.width)
  const height = useThree((s) => s.viewport.height)
  const mouseSphereRef = useRef<RapierRigidBody>(null)
  const groupRef = useRef<THREE.Group>(null)

  const { nodes } = useGLTF('/models/cross.glb') as unknown as GLTFResult

  const controls = useControls({
    debug: false
  })

  useFrame(({ pointer }) => {
    mouseSphereRef.current?.setTranslation(
      vec3({
        x: pointer.x * (width / 2),
        y: pointer.y * (height / 2),
        z: 0
      }),
      true
    )
  })

  const WALL_THICKNESS = 1
  const MOUSE_COLLIDER_SIZE = 0.25
  const CROSS_SIZE = 0.5

  const boxGeometry = useMemo(() => {
    return new THREE.BoxGeometry(1, 1, 1)
  }, [])

  return (
    <Physics gravity={[0, 0, 0]} debug={controls.debug}>
      <axesHelper visible={controls.debug} />

      <group position={[0, 0, 0]} ref={groupRef}>
        {/* Body */}
        {range(count).map((i) => (
          <RigidBody
            position={[
              /* Some random numbers */
              Math.random() * (width * 0.9) - (width * 0.9) / 2,
              Math.random() * (height * 0.9) - (height * 0.9) / 2,
              0
            ]}
            rotation={[
              Math.random() * Math.PI * 2,
              Math.random() * Math.PI * 2,
              Math.random() * Math.PI * 2
            ]}
            scale={[CROSS_SIZE, CROSS_SIZE, CROSS_SIZE]}
            colliders={'hull'}
            mass={1}
            enabledTranslations={[true, true, false]}
            key={i}
          >
            <mesh geometry={nodes['cross'].geometry} material={crossMaterial} />
          </RigidBody>
        ))}

        {/* Mouse tracked sphere */}
        <RigidBody
          colliders={'cuboid'}
          type="kinematicVelocity"
          mass={5}
          enabledTranslations={[true, true, false]}
          ref={mouseSphereRef}
          includeInvisible
        >
          <mesh position={[0, 0, 0]} visible={controls.debug}>
            <boxGeometry
              args={[
                MOUSE_COLLIDER_SIZE,
                MOUSE_COLLIDER_SIZE,
                MOUSE_COLLIDER_SIZE
              ]}
            />
            <meshBasicMaterial
              color="green"
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
        </RigidBody>

        {/* Floor */}
        <group>
          <RigidBody
            type="fixed"
            colliders={'cuboid'}
            position={[0, height / 2 + WALL_THICKNESS / 2, 0]}
            scale={[width, WALL_THICKNESS, 1]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <mesh geometry={boxGeometry}>
              <meshBasicMaterial color="blue" />
            </mesh>
          </RigidBody>
          <RigidBody
            type="fixed"
            colliders={'cuboid'}
            position={[0, -height / 2 - WALL_THICKNESS / 2, 0]}
            scale={[width, WALL_THICKNESS, 1]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <mesh geometry={boxGeometry}>
              <meshBasicMaterial color="blue" />
            </mesh>
          </RigidBody>
          <RigidBody
            type="fixed"
            colliders={'cuboid'}
            position={[-width / 2 - WALL_THICKNESS / 2, 0, 0]}
            scale={[WALL_THICKNESS, 1, height]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <mesh geometry={boxGeometry}>
              <meshBasicMaterial color="blue" />
            </mesh>
          </RigidBody>
          <RigidBody
            type="fixed"
            colliders={'cuboid'}
            position={[width / 2 + WALL_THICKNESS / 2, 0, 0]}
            scale={[WALL_THICKNESS, 1, height]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <mesh geometry={boxGeometry}>
              <meshBasicMaterial color="blue" />
            </mesh>
          </RigidBody>
        </group>
      </group>
      <Stats />
    </Physics>
  )
}

const CrossNormalDisplace = () => {
  const crossMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const { nodes } = useGLTF('/models/cross.glb') as unknown as GLTFResult

  useFrame(() => {
    if (!crossMaterialRef.current) return
    crossMaterialRef.current.uniforms.uTime.value += 0.01
  })

  return (
    <>
      <mesh geometry={nodes['cross'].geometry}>
        <shaderMaterial
          uniforms={{
            uTime: { value: 0 },
            uColor: { value: new THREE.Color('red') }
          }}
          vertexShader={`
            uniform float uTime;
            varying vec3 vNormal;
            
            void main() {
              vNormal = normal;

              vec3 newPosition = position + normal * (sin(uTime) * 0.5 + 0.5);

              gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            varying vec3 vNormal;
            void main() {
              gl_FragColor = vec4(uColor, 1.0);
            }
          `}
          side={THREE.DoubleSide}
          ref={crossMaterialRef}
        />
      </mesh>
    </>
  )
}

const CrossSphereDisplace = () => {
  const crossMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const { nodes } = useGLTF('/models/cross.glb') as unknown as GLTFResult

  useFrame(() => {
    if (!crossMaterialRef.current) return
    // crossMaterialRef.current.uniforms.uTime.value += 0.01
  })

  return (
    <>
      <mesh geometry={nodes['cross'].geometry}>
        <meshNormalMaterial side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

const TestsOnGeometryAsset = () => {
  const [trackDiv1, setTrackDiv1] = useState<HTMLDivElement | null>(null)
  const [trackDiv2, setTrackDiv2] = useState<HTMLDivElement | null>(null)
  const [trackDiv3, setTrackDiv3] = useState<HTMLDivElement | null>(null)
  const [trackDiv4, setTrackDiv4] = useState<HTMLDivElement | null>(null)

  const ZOOM = 150
  const CAM_POSITION = new THREE.Vector3(0, 0, 5)
  const CAM_POSITION_DIAGONAL = new THREE.Vector3(-5, 5, 5)

  const crossDepthMaterial = useMemo(() => {
    const material = new THREE.MeshDepthMaterial({})
    material.side = THREE.FrontSide
    return material
  }, [])

  const normalMaterial = useMemo(() => {
    const material = new THREE.MeshNormalMaterial({})
    material.side = THREE.FrontSide
    return material
  }, [])

  return (
    <>
      <div style={{ position: 'fixed', width: '100%', height: '100%' }}>
        <Canvas
          orthographic
          camera={{ zoom: ZOOM, near: 3, far: 8, position: CAM_POSITION }}
          // @ts-ignore
          eventSource={document.querySelector('#__next')}
        >
          {/* @ts-ignore */}
          {trackDiv1 && (
            <View track={{ current: trackDiv1 }} frames={1}>
              <OrthographicCamera
                near={3}
                zoom={ZOOM}
                far={8}
                position={CAM_POSITION}
                makeDefault
              />
              <Tank crossMaterial={normalMaterial} />
            </View>
          )}

          {/* @ts-ignore */}
          {trackDiv2 && (
            <View track={{ current: trackDiv2 }} frames={1}>
              <OrthographicCamera
                near={3}
                zoom={ZOOM}
                far={5.5}
                position={CAM_POSITION}
                makeDefault
              />
              <Tank crossMaterial={crossDepthMaterial} />
            </View>
          )}

          {/* @ts-ignore */}
          {trackDiv3 && (
            <View track={{ current: trackDiv3 }} frames={1}>
              <gridHelper />
              <OrbitControls />
              <OrthographicCamera
                // near={3}
                // far={8}
                zoom={ZOOM}
                position={CAM_POSITION_DIAGONAL}
                makeDefault
              />
              <CrossNormalDisplace />
            </View>
          )}

          {/* @ts-ignore */}
          {trackDiv4 && (
            <View track={{ current: trackDiv4 }} frames={1}>
              <gridHelper />
              <OrbitControls />
              <OrthographicCamera
                // near={3}
                // far={8}
                zoom={ZOOM}
                position={CAM_POSITION_DIAGONAL}
                makeDefault
              />
              <CrossSphereDisplace />
            </View>
          )}
        </Canvas>
      </div>

      <div
        style={{
          display: 'grid',
          position: 'fixed',
          width: '100%',
          height: '100%',
          gridTemplateColumns: 'repeat(2, 1fr)',
          zIndex: 10
        }}
      >
        <div
          style={{ border: '1px solid transparent' }}
          ref={(r) => setTrackDiv1(r)}
        />
        <div
          style={{ border: '1px solid transparent' }}
          ref={(r) => setTrackDiv2(r)}
        />
        <div
          style={{ border: '1px solid transparent' }}
          ref={(r) => setTrackDiv3(r)}
        />
        <div
          style={{ border: '1px solid transparent' }}
          ref={(r) => setTrackDiv4(r)}
        />
      </div>
    </>
  )
}

TestsOnGeometryAsset.Title = 'Tests on Geometry Asset'
TestsOnGeometryAsset.Layout = HTMLLayout

export default TestsOnGeometryAsset
