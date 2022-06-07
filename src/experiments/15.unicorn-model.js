import { Center, Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { useRef } from 'react'

const Unicorn = (props) => {
  const group = useRef()
  const { nodes, materials } = useGLTF('/models/Unicorn_v3.gltf')
  return (
    <>
      <OrbitControls />
      <Environment preset="sunset" />
      {/* <pointLight position="" /> */}
      <color attach="background" args={['#666']} />
      <ambientLight intensity={0.1} />

      <Center>
        <group ref={group} {...props} dispose={null}>
          <group position={[0, 0, 0.05]}>
            <primitive object={nodes.spine001} />
            <skinnedMesh
              geometry={nodes.Horn.geometry}
              material={materials['Material.003']}
              skeleton={nodes.Horn.skeleton}
            />
            <skinnedMesh
              geometry={nodes.Cola2.geometry}
              material={nodes.Cola2.material}
              skeleton={nodes.Cola2.skeleton}
            />
            <skinnedMesh
              geometry={nodes.Hair.geometry}
              material={nodes.Hair.material}
              skeleton={nodes.Hair.skeleton}
            />
            <skinnedMesh
              geometry={nodes.Body_1.geometry}
              material={materials.Unicorn}
              skeleton={nodes.Body_1.skeleton}
            />
            <skinnedMesh
              geometry={nodes.Body_2.geometry}
              material={materials.Black}
              skeleton={nodes.Body_2.skeleton}
            />
            <skinnedMesh
              geometry={nodes.Body_3.geometry}
              material={nodes.Body_3.material}
              skeleton={nodes.Body_3.skeleton}
            />
          </group>
        </group>
      </Center>
    </>
  )
}

Unicorn.Title = 'This is an Unicorn'

export default Unicorn
