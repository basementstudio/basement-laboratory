import { OrbitControls, Stats } from '@react-three/drei'
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise
} from '@react-three/postprocessing'
import { folder, useControls } from 'leva'

import { GrassMesh } from './grass'
import Plane from './plane'

export default function Scene() {
  const Effects = () => {
    const controls = useControls({
      bloom: folder({
        luminanceThreshold: {
          value: 0.16,
          min: 0,
          max: 1,
          step: 0.01
        },
        luminanceSmoothing: {
          value: 1,
          min: 0,
          max: 1,
          step: 0.01
        },
        bloomIntensity: {
          value: 0.1,
          min: 0,
          max: 30,
          step: 0.01
        }
      }),
      depthOfField: folder({
        focusDistance: {
          value: 0,
          min: 0,
          max: 1,
          step: 0.01
        },
        focalLength: {
          value: 0,
          min: 0,
          max: 1,
          step: 0.01
        },
        bokehScale: {
          value: 0,
          min: 0,
          max: 10,
          step: 0.01
        },
        height: {
          value: 0,
          min: 0,
          max: 1000,
          step: 1
        }
      }),
      noise: folder({
        opacity: {
          value: 0,
          min: 0,
          max: 1,
          step: 0.01
        }
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
        <DepthOfField
          focusDistance={controls.focusDistance}
          focalLength={controls.focalLength}
          bokehScale={controls.bokehScale}
          height={controls.height}
        />
        <Noise opacity={controls.opacity} />
      </EffectComposer>
    )
  }

  return (
    <group position={[0, 0, 0]}>
      <Stats />
      <OrbitControls />

      <ambientLight intensity={0.5} />
      <directionalLight position={[8.35, 9, 7]} intensity={8} />
      <directionalLight position={[0.18, 1.4, -12.7]} intensity={8} />

      <GrassMesh />
      <Plane />

      <Effects />
    </group>
  )
}
