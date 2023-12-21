import {
  OrbitControls,
  OrthographicCamera,
  Stats,
  useGLTF,
  View
} from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Physics, RapierRigidBody, RigidBody, vec3 } from '@react-three/rapier'
import { useControls } from 'leva'
import { range } from 'lodash'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GLTF } from 'three-stdlib'

import { HTMLLayout } from '~/components/layout/html-layout'

type GLTFResult = GLTF & {
  nodes: {
    cross: THREE.Mesh
  }
}

type TankProps = {
  crossMaterial?: THREE.Material
}

const Tank = ({ crossMaterial }: TankProps) => {
  const viewport = useThree((state) => state.viewport)
  const mouseSphereRef = useRef<RapierRigidBody>(null)
  const groupRef = useRef<THREE.Group>(null)
  const {
    nodes: { cross }
  } = useGLTF('/models/cross.glb') as unknown as GLTFResult
  const controls = useControls({
    debug: false
  })

  useFrame(({ pointer, viewport }) => {
    mouseSphereRef.current?.setTranslation(
      vec3({
        x: pointer.x * (viewport.width / 2),
        y: pointer.y * (viewport.height / 2),
        z: 0
      }),
      true
    )
  })

  const WALL_THICKNESS = 1
  const MOUSE_COLLIDER_SIZE = 0.25
  const CROSS_SIZE = 0.5

  return (
    <Physics gravity={[0, 0, 0]} debug={controls.debug}>
      <axesHelper visible={controls.debug} />
      <OrbitControls enablePan={false} enableRotate={false} />
      <group position={[0, 0, 0]} ref={groupRef}>
        {/* Body */}
        {range(15).map((i) => (
          <RigidBody
            scale={[CROSS_SIZE, CROSS_SIZE, CROSS_SIZE]}
            colliders={'hull'}
            mass={1}
            enabledTranslations={[true, true, false]}
            key={i}
          >
            <mesh geometry={cross.geometry} material={crossMaterial}>
              {!crossMaterial && <meshNormalMaterial depthWrite={false} />}
            </mesh>
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
            position={[0, viewport.height / 2 + WALL_THICKNESS / 2, 0]}
            scale={[viewport.width, WALL_THICKNESS, 1]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="blue" />
            </mesh>
          </RigidBody>
          <RigidBody
            type="fixed"
            colliders={'cuboid'}
            position={[0, -viewport.height / 2 - WALL_THICKNESS / 2, 0]}
            scale={[viewport.width, WALL_THICKNESS, 1]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="blue" />
            </mesh>
          </RigidBody>
          <RigidBody
            type="fixed"
            colliders={'cuboid'}
            position={[-viewport.width / 2 - WALL_THICKNESS / 2, 0, 0]}
            scale={[WALL_THICKNESS, 1, viewport.height]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="blue" />
            </mesh>
          </RigidBody>
          <RigidBody
            type="fixed"
            colliders={'cuboid'}
            position={[viewport.width / 2 + WALL_THICKNESS / 2, 0, 0]}
            scale={[WALL_THICKNESS, 1, viewport.height]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="blue" />
            </mesh>
          </RigidBody>
        </group>
      </group>
      <Stats />
    </Physics>
  )
}

const TestsOnGeometryAsset = () => {
  const trackDiv1 = useRef<HTMLDivElement>(null)
  const trackDiv2 = useRef<HTMLDivElement>(null)

  const ZOOM = 150
  const CAM_POSITION = new THREE.Vector3(0, 0, 5)

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
          <View track={trackDiv1} frames={10}>
            <Tank />
          </View>
          {/* @ts-ignore */}
          <View track={trackDiv2} frames={10}>
            <OrthographicCamera
              manual={false}
              near={3}
              zoom={ZOOM}
              far={5.5}
              position={CAM_POSITION}
              makeDefault
            />
            <Tank
              crossMaterial={useMemo(() => {
                const material = new THREE.MeshDepthMaterial({})
                // material.color
                material.side = THREE.BackSide
                // material.color = new THREE.Color('red')
                return material
              }, [])}
            />
          </View>
        </Canvas>
      </div>
      <div
        id="events"
        style={{
          display: 'grid',
          position: 'fixed',
          width: '100%',
          height: '100%',
          gridTemplateColumns: 'repeat(2, 1fr)',
          zIndex: 10
        }}
      >
        <div style={{ border: '1px solid red' }} ref={trackDiv1}></div>
        <div style={{ border: '1px solid blue' }} ref={trackDiv2}></div>
      </div>
    </>
  )
}

TestsOnGeometryAsset.Title = 'Tests on Geometry Asset'
TestsOnGeometryAsset.Layout = HTMLLayout

export default TestsOnGeometryAsset
