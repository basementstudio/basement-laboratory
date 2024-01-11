import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Mesh } from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

import { HTMLLayout } from '~/components/layout/html-layout'

import { RenderTexture } from './render-texture'

interface MonitorNodes extends GLTF {
  nodes: {
    monitor: Mesh
    pantalla: Mesh
    cable: Mesh
  }
}

const RenderTextureExample = () => {
  const { nodes } = useGLTF('/models/monitor.glb') as MonitorNodes

  return (
    <div style={{ position: 'fixed', height: '100vh', width: '100vw' }}>
      <Canvas>
        <ambientLight intensity={2} />
        <PerspectiveCamera makeDefault position={[1, 1, 4]} />

        <group>
          <primitive object={nodes.monitor}>
            <meshStandardMaterial color="#ccc" />
          </primitive>
          <primitive object={nodes.cable} />
          <primitive object={nodes.pantalla}>
            <meshStandardMaterial>
              {/* Here we can add the child scene as a texture to the material */}
              <RenderTexture attach="map">
                <ambientLight intensity={2} />
                <OrbitControls />
                <PerspectiveCamera makeDefault position={[0, 0, 2]} />

                <mesh position={[0, 1, 0]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="red" />
                </mesh>
                <mesh>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="hotpink" />
                </mesh>
              </RenderTexture>
            </meshStandardMaterial>
          </primitive>
        </group>
      </Canvas>
    </div>
  )
}

RenderTextureExample.Title = 'Render Texture'
RenderTextureExample.Layout = HTMLLayout

export default RenderTextureExample
