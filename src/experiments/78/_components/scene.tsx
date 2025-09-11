import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import XMCPModel from './XmcpModel'
import CircularTextSpell from './CircularTextSpell'
import { folder, useControls } from 'leva'
import { Bloom, EffectComposer } from '@react-three/postprocessing'

export default function Scene() {
  const Effects = () => {
    const controls = useControls({
      'Bloom Effect': folder({
        luminanceThreshold: { value: 0.07, min: 0, max: 1, step: 0.01 },
        luminanceSmoothing: { value: 0.2, min: 0, max: 1, step: 0.01 },
        bloomIntensity: { value: 0.2, min: 0, max: 10, step: 0.1 }
      })
    })

    return (
      <EffectComposer multisampling={0} stencilBuffer={true}>
        <Bloom
          luminanceThreshold={controls.luminanceThreshold}
          luminanceSmoothing={controls.luminanceSmoothing}
          intensity={controls.bloomIntensity}
          height={300}
        />
      </EffectComposer>
    )
  }

  return (
    <>
      <OrbitControls enableDamping enableZoom={true} enableRotate={false} />
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={60} />

      <pointLight position={[0, 0, 0]} intensity={5} color="#ffffff" />

      <mesh position={[0, -2, 0]} rotation={[-1.3, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="black" />
      </mesh>

      <ambientLight intensity={10} color="#404040" />

      <CircularTextSpell presetProps="circular" textContent="x" />
      <CircularTextSpell presetProps="spiral" textContent="Ship" />
      <XMCPModel />
      <Effects />
    </>
  )
}
