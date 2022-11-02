import { Environment, Instance, Instances, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
// import { useControls } from 'leva'
import { gsap } from 'lib/gsap'
import React, {
  forwardRef,
  /* useCallback,  */ useLayoutEffect /* useMemo */
} from 'react'

// import { Vector2 } from 'three'
import { useGsapContext } from '~/hooks/use-gsap-context'

// import { plot } from '../lib/plugins/leva/plot'

class SecondOrderDynamics {
  PI = Math.PI
  /*  */
  xp
  /*  */
  y
  yd
  /*  */
  k1
  k2
  k3

  constructor(f, z, r, x0) {
    this.setConfig(f, z, r, x0)
  }

  setConfig(f, z, r, x0) {
    this.k1 = z / (this.PI * f)
    this.k2 = 1 / (2 * this.PI * f * (2 * this.PI * f))
    this.k3 = (r * z) / (2 * this.PI * f)

    this.xp = x0
    this.y = x0
    this.yd = 0
  }

  Update(T, x, xd = null) {
    if (xd == null) {
      xd = (x - this.xp) / T
      this.xp = x
    }

    // const k2_stable = Math.max(
    //   this.k2,
    //   T * (T / 2) + (T * this.k1) / 2,
    //   T * this.k1
    // )
    this.y = this.y + T * this.yd
    this.yd =
      this.yd + T * ((x + this.k3 * xd - this.y - this.k1 * this.yd) / this.k2)

    return this.y
  }
}

const SecondOrderDynamicsInstance = new SecondOrderDynamics(2, 0.5, 1, 0)
const SecondOrderDynamicsInstance2 = new SecondOrderDynamics(2, 0.5, 1, 0)
const SecondOrderDynamicsInstance3 = new SecondOrderDynamics(2, 0.5, 2, 0)
const SecondOrderDynamicsInstance4 = new SecondOrderDynamics(2, 0.5, 2, 0)

const Grid = ({ number = 23, lineWidth = 0.026, height = 0.5 }) => (
  // Renders a grid and crosses as instances
  <Instances position={[0, -0.26, 0]}>
    <planeGeometry args={[lineWidth, height]} />
    <meshBasicMaterial color="#999" />
    {Array.from({ length: number }, (_, y) =>
      Array.from({ length: number }, (_, x) => (
        <group
          key={x + ':' + y}
          position={[
            x * 2 - Math.floor(number / 2) * 2,
            -0.01,
            y * 2 - Math.floor(number / 2) * 2
          ]}
        >
          <Instance rotation={[-Math.PI / 2, 0, 0]} />
          <Instance rotation={[-Math.PI / 2, 0, Math.PI / 2]} />
        </group>
      ))
    )}
    <gridHelper args={[100, 100, '#bbb', '#bbb']} position={[0, 0, 0]} />
  </Instances>
)

const Drone = forwardRef((props, ref) => {
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

const DroneAnimation = () => {
  const droneRef = React.useRef()
  const locked = React.useRef(true)
  const camera = useThree((state) => state.camera)

  // const pointer = useThree((state) => state.pointer)

  // const TRGT = 1

  // const values = useControls({
  //   w: 1,
  //   f: 0.2,
  //   z: -1,
  //   r: -1,
  //   x0: 1,
  //   y1: plot({
  //     expression: (x) => {
  //       const res = SecondOrderDynamicsInstance.Update(0.016, TRGT)

  //       console.log(res)

  //       return res - TRGT
  //     },
  //     boundsX: [0, 10],
  //     boundsY: [-1, 1]
  //   })
  // })

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
    const drone = droneRef.current
    const timeline = gsap.timeline()

    locked.current = true

    timeline.set(drone.position, { x: 0, y: 0, z: 0 })
    timeline.set(drone.rotation, { x: 0, y: 0, z: 0 })

    timeline.to({}, { duration: 0 })

    drone.traverse((e) => {
      if (/(N_Lf*)|(H_Rt*)|(H_Lf*)|(N_Rt*)/.test(e.name)) {
        timeline.fromTo(
          e.rotation,
          { z: 0 },
          { z: Math.PI * 2, duration: 0.1, repeat: -1, ease: 'none' }
        )
      }
    })

    timeline
      .fromTo(
        drone.position,
        {
          y: 0
        },
        {
          y: 2,
          duration: 1.5,
          onComplete: () => {
            locked.current = false
          }
        }
      )
      .fromTo(
        drone.position,
        {
          y: 2
        },
        {
          y: 1.8,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
          duration: 2.5
        }
      )
  }, [])

  useFrame((state, delta) => {
    if (locked.current) return

    console.log(delta)

    const drone = droneRef.current
    // const { x, y } = pointer
    // const speed = 0.2
    // const targetX = x * speed
    // const targetY = y * speed

    drone.rotation.z = SecondOrderDynamicsInstance3.Update(delta, 0)
    drone.rotation.x = SecondOrderDynamicsInstance4.Update(delta, 0)

    drone.position.x = SecondOrderDynamicsInstance.Update(
      delta,
      state.pointer.x
    )
    drone.position.z = SecondOrderDynamicsInstance2.Update(
      delta,
      -state.pointer.y
    )

    /* Make interpolation logic w/position */
  })

  return (
    <>
      <fog attach="fog" near={20} far={40} color="#f2f2f5" />
      {/* <OrbitControls /> */}
      <color attach="background" args={['#f2f2f5']} />
      <Environment preset="apartment" />
      <Grid />
      <Drone ref={droneRef} />
    </>
  )
}

DroneAnimation.Title = 'Drone Animation'
DroneAnimation.Tags = 'animation,private'

export default DroneAnimation
