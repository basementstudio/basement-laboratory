import { Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Debug, Physics, RigidBody } from '@react-three/rapier'
import { gsap } from 'lib/gsap'
import React, { forwardRef, useLayoutEffect, useRef } from 'react'
import useRefs from 'react-use-refs'
import * as THREE from 'three'

import { useGsapContext } from '~/hooks/use-gsap-context'
import { useMousetrap } from '~/hooks/use-mousetrap'

const Drone = forwardRef((props, ref) => {
  // const [body, rotor1, rotor2, rotor3, rotor4] = useRefs()
  const { nodes } = useGLTF('/models/drone.glb')

  return (
    <group {...props} dispose={null} ref={ref}>
      <mesh
        name="H_Lf_3"
        geometry={nodes.H_Lf_3.geometry}
        material={nodes.H_Lf_3.material}
        position={[-0.95, 0.05, 0.99]}
        rotation={[Math.PI / 2, 0, -2.27]}
      />
      <mesh
        name="N_Lf_1"
        geometry={nodes.N_Lf_1.geometry}
        material={nodes.N_Lf_1.material}
        position={[-0.94, 0.05, -0.92]}
        rotation={[Math.PI / 2, 0, 2.27]}
      />
      <mesh
        name="N_Rt_2"
        geometry={nodes.N_Rt_2.geometry}
        material={nodes.N_Rt_2.material}
        position={[0.96, 0.05, -0.92]}
        rotation={[Math.PI / 2, 0, -2.27]}
      />
      <mesh
        name="H_Rt_4"
        geometry={nodes.H_Rt_4.geometry}
        material={nodes.H_Rt_4.material}
        position={[0.96, 0.05, 0.99]}
        rotation={[Math.PI / 2, 0, -2.27]}
      />
      <mesh
        name="body"
        geometry={nodes.body.geometry}
        material={nodes.body.material}
        position={[0.01, -0.01, 0]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
    </group>
  )
})

const Floor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial color={0xffff00} />
    </mesh>
  )
}

const initialDronePosition = new THREE.Vector3(0, 5, 0)

const dir = new THREE.Vector3(0, 1, 0)
const origin = new THREE.Vector3(0, 0, 0)
const euler = new THREE.Euler(0, 0, 0, 'ZXY')
// const offset = {
//   x: 0.96,
//   z: 0.96
// }

const DroneAnimation = () => {
  const [arrowRFRef, arrowRRRef, arrowLFRef, arrowLRRef] = useRefs()
  // const meshRef = useRef()
  const droneRef = useRef()
  const dronePhysicRef = useRef()
  const camera = useThree((state) => state.camera)

  const gas = useRef(false)

  const helice = {
    H_Lf: arrowLFRef,
    N_Lf: arrowLRRef,
    H_Rt: arrowRFRef,
    N_Rt: arrowRRRef
  }

  useLayoutEffect(() => {
    camera.position.set(
      -2.686254998281318,
      4.787375502400528,
      3.964893809990995
    )
    camera.rotation.set(
      -0.8064363865450014,
      -0.4717243090276139,
      -0.44259724605415995
    )
  }, [camera])

  useGsapContext(() => {
    // const drone = droneRef.current
    const timeline = gsap.timeline()

    timeline.to({}, { duration: 0 })

    // drone.traverse((e) => {
    //   if (/(N_Lf*)|(H_Rt*)|(H_Lf*)|(N_Rt*)/.test(e.name)) {
    //     timeline.fromTo(
    //       e.rotation,
    //       { z: 0 },
    //       { z: Math.PI * 2, duration: 0.1, repeat: -1, ease: 'none' }
    //     )
    //   }
    // })
  }, [])

  useMousetrap([
    {
      keys: 'space',
      callback: () => {
        gas.current = !gas.current
        console.log(dronePhysicRef.current)
      }
    },
    {
      keys: 'c',
      callback: () => {
        dronePhysicRef.current.resetForces(true)
      }
    }
  ])

  useFrame((st) => {
    // if (!arrowRef.current) return

    const { x, y } = st.pointer

    // Rotate vec3 towards mouse on x & y axis
    euler.set(-y * (Math.PI / 2), 1, -x * (Math.PI / 2))

    const force = (dronePhysicRef.current.mass() * 10) / 4

    const forceVector = dir
      .clone()
      .setY(force)
      .applyQuaternion(dronePhysicRef.current.rotation())

    dronePhysicRef.current.resetForces(true)
    dronePhysicRef.current.resetTorques(true)

    console.log(dronePhysicRef.current.colliders)

    droneRef.current.getWorldPosition(origin)

    droneRef.current.traverse((e) => {
      const res = /(N_Lf*)|(H_Rt*)|(H_Lf*)|(N_Rt*)/.exec(e.name)

      // switch (res?.[0]) {
      //   case 'N_Lf':
      //     origin.copy(currPosition).add({ y: 0, z: offset.z, x: -offset.x })
      //     break
      //   case 'H_Lf':
      //     origin.copy(currPosition).add({ y: 0, z: -offset.z, x: -offset.x })
      //     break
      //   case 'H_Rt':
      //     origin.copy(currPosition).add({ y: 0, z: -offset.z, x: offset.x })
      //     break
      //   case 'N_Rt':
      //     origin.copy(currPosition).add({ y: 0, z: offset.z, x: offset.x })
      //     break
      //   default:
      //     break
      // }

      if (gas.current) {
        dronePhysicRef.current.addForceAtPoint(forceVector, origin)
      }

      if (res) {
        helice[res[0]].current.position.copy(origin)
        helice[res[0]].current.setDirection(
          dir.set(0, 1, 0).applyQuaternion(dronePhysicRef.current.rotation())
        )

        // console.log(arrowRef.current.position)
      }
    })
  })

  return (
    <>
      <gridHelper position={[0, 0.01, 0]} args={[100, 100]} />
      <OrbitControls />
      <color attach="background" args={['#f2f2f5']} />
      <Environment preset="apartment" />

      {/* <mesh position={[0, 3, 0]} ref={meshRef}>
        <coneGeometry args={[1, 3, 32]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh> */}

      <arrowHelper args={[dir, origin, 1, 0xff0000]} ref={arrowRFRef} />
      <arrowHelper args={[dir, origin, 1, 0xff0000]} ref={arrowRRRef} />
      <arrowHelper args={[dir, origin, 1, 0x00ff00]} ref={arrowLFRef} />
      <arrowHelper args={[dir, origin, 1, 0x00ff00]} ref={arrowLRRef} />

      <Physics gravity={[0, -9.8, 0]} timeStep="vary">
        <Debug />

        <RigidBody colliders="cuboid" ref={dronePhysicRef}>
          <Drone position={initialDronePosition} ref={droneRef} />
        </RigidBody>

        <RigidBody colliders="cuboid">
          <Floor />
        </RigidBody>
      </Physics>
    </>
  )
}

export const title = 'Drone Animation'
DroneAnimation.Tags = 'animation,private'

export default DroneAnimation
