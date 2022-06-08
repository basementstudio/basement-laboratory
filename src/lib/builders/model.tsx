import { Center, Environment, OrbitControls, useGLTF } from '@react-three/drei'
// @ts-ignore
import { presetsObj } from '@react-three/drei/helpers/environment-assets.cjs'
import { useControls } from 'leva'
import { FC } from 'react'

import { useLoader } from '~/components/common/loader'

const baseControls = {
  scale: 1,
  ambientLight: 1,
  background: '#000',
  environment: 'city'
}

export const model = (path: string, config?: typeof baseControls): FC => {
  return () => {
    const setLoaded = useLoader((s) => s.setLoaded)
    const model = useGLTF(`/models/${path}`, undefined, undefined, (loader) => {
      loader.manager.onLoad = () => setLoaded()
    })

    const resolvedConfig = useControls({
      scale: {
        min: 0,
        step: 0.1,
        value: config?.scale || baseControls.scale,
        max: 10
      },
      ambientLight: {
        min: 0,
        step: 0.1,
        value: config?.ambientLight || baseControls.ambientLight,
        max: 2
      },
      background: {
        value: config?.background || baseControls.background
      },
      environment: {
        options: Object.keys(presetsObj),
        value: config?.environment || baseControls.environment
      }
    })

    return (
      <>
        <color attach="background" args={[resolvedConfig.background]} />
        {/* @ts-ignore */}
        <Environment preset={resolvedConfig?.environment} />
        <ambientLight intensity={resolvedConfig?.ambientLight} />
        <OrbitControls />
        <Center>
          <group scale={resolvedConfig?.scale}>
            {/*@ts-ignore*/}
            <primitive object={model.scene} />
          </group>
        </Center>
      </>
    )
  }
}
