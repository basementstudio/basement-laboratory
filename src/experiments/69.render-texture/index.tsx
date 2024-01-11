import { PerspectiveCamera, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { Mesh } from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

import { HTMLLayout } from '~/components/layout/html-layout'

import { InnerScene } from './inner-scene'
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

  const [isOn, setIsOn] = useState(true)

  const switchPower = () => {
    setIsOn(() => !isOn)
  }

  return (
    <div style={{ position: 'fixed', height: '100vh', width: '100vw' }}>
      <Canvas>
        <spotLight
          position={[1.5, 2, 3]}
          intensity={15}
          castShadow
          angle={0.4}
          penumbra={0.7}
        />
        <ambientLight intensity={0.5} />
        <PerspectiveCamera makeDefault position={[0, 0.7, 2.5]} />

        <mesh position={[-0.28, 0.27, 0.5]} onClick={switchPower}>
          <boxGeometry args={[0.1, 0.05, 0.1]} />
          <meshStandardMaterial color="black" />
        </mesh>

        <mesh>
          <boxGeometry args={[20, 0.05, 20]} />
          <meshStandardMaterial color="#333" />
        </mesh>

        <group>
          <primitive object={nodes.monitor}>
            <meshStandardMaterial color="#555" />
          </primitive>
          <primitive object={nodes.cable} />
          <primitive object={nodes.pantalla}>
            <meshStandardMaterial>
              {/* Here we can add the child scene as a texture to the material */}
              <RenderTexture
                width={100}
                height={70}
                isPlaying={isOn}
                attach="map"
              >
                <InnerScene />
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
