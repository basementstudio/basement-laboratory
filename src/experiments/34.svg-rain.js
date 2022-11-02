import { OrbitControls, useGLTF } from '@react-three/drei'
import { Physics, RigidBody } from '@react-three/rapier'

import { AspectCanvas } from '~/components/common/aspect-canvas'
import { HTMLLayout } from '~/components/layout/html-layout'

export function Model(props) {
  const { nodes, materials } = useGLTF('/models/cupcake.glb')

  return (
    <group {...props} dispose={null}>
      <group
        position={[0.12, 1.12, 0.15]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      >
        <mesh
          geometry={nodes.Cone_low.geometry}
          material={materials.CupCake_mtl}
          position={[50.07, -49.87, -76.58]}
          rotation={[2.11, 0.21, -3.14]}
        />
        <mesh
          geometry={nodes.Cream_low.geometry}
          material={materials.CupCake_mtl}
          position={[9.41, 3.45, 44.91]}
        />
        <mesh
          geometry={nodes.Cup_low.geometry}
          material={materials.CupCake_mtl}
          position={[13.18, 7.6, 123.25]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        <mesh
          geometry={nodes.Torus_low.geometry}
          material={materials.CupCake_mtl}
          position={[-72.13, 37.58, -90]}
          rotation={[0.09, -1.07, 0.16]}
        />
      </group>
    </group>
  )
}

const SVGRain = () => {
  return (
    <>
      <OrbitControls />
      <Physics colliders="hull" gravity={[0, -9.8, 0]}>
        <ambientLight intensity={0.8} />
        <RigidBody rotation={[0, 0, Math.PI]} position={[0, 8, 0]}>
          <Model />
        </RigidBody>

        <RigidBody rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
          <mesh>
            <planeBufferGeometry args={[15, 15]} />
            <meshNormalMaterial />
          </mesh>
        </RigidBody>
      </Physics>
    </>
  )
}

SVGRain.Title = 'SVG Rain'
SVGRain.Tags = 'animation, private'
SVGRain.Layout = ({ children, ...props }) => (
  <HTMLLayout {...props}>
    <AspectCanvas
      aspect={21 / 9}
      config={{ camera: { position: [0, 10, -10] } }}
    >
      {children}
    </AspectCanvas>
  </HTMLLayout>
)

export default SVGRain
