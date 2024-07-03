import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { degToRad } from 'three/src/math/MathUtils'

import { HTMLLayout } from '~/components/layout/html-layout'

import { Computer } from './computer'

const RenderTextureExample = () => {
  return (
    <div style={{ position: 'fixed', height: '100vh', width: '100vw' }}>
      <Canvas>
        <OrbitControls
          minPolarAngle={degToRad(40)}
          maxPolarAngle={degToRad(90)}
          maxDistance={5}
          minDistance={1}
          enablePan={false}
          target={[0, 0.7, 0.5]}
        />
        <PerspectiveCamera makeDefault fov={30} position={[0, 0.2, 2.5]} />
        <spotLight
          position={[1.5, 2, 3]}
          intensity={15}
          castShadow
          angle={0.4}
          penumbra={0.7}
        />
        {/* <ambientLight intensity={0.5} /> */}

        <pointLight position={[-3, 5, -3]} intensity={5} />

        {/* Ground */}
        <mesh rotation={[Math.PI * -0.5, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#333" />
        </mesh>

        <Computer />
      </Canvas>
    </div>
  )
}

RenderTextureExample.Title = 'Render Texture'
RenderTextureExample.Layout = HTMLLayout

export default RenderTextureExample
