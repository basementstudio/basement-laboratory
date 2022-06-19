import { Center, Environment, OrbitControls, useGLTF } from '@react-three/drei'
// @ts-ignore
import { presetsObj } from '@react-three/drei/helpers/environment-assets.cjs'
import { useControls } from 'leva'
import { FC } from 'react'

import { Loader, useLoader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

const baseControls = {
  scale: 1,
  ambientLight: 1,
  background: '#000',
  environment: 'city'
}

export const model = (
  input: string | { path: string; environment: string },
  controls?: typeof baseControls
): FC => {
  const { path, environment } =
    typeof input === 'string' ? { path: input, environment: undefined } : input

  const Comp = () => {
    const setLoaded = useLoader((s) => s.setLoaded)
    const model = useGLTF(`/models/${path}`, undefined, undefined, (loader) => {
      loader.manager.onLoad = () => setLoaded()
    })

    const resolvedConfig = useControls({
      scale: {
        min: 0,
        step: 0.1,
        value: controls?.scale || baseControls.scale,
        max: 10
      },
      ambientLight: {
        min: 0,
        step: 0.1,
        value: controls?.ambientLight || baseControls.ambientLight,
        max: 2
      },
      background: {
        value: controls?.background || baseControls.background
      },
      environment: environment
        ? {
            value: environment,
            disabled: true
          }
        : {
            options: Object.keys(presetsObj),
            value: controls?.environment || baseControls.environment
          }
    })

    return (
      <>
        <color attach="background" args={[resolvedConfig.background]} />
        {/* @ts-ignore */}
        <Environment
          {...(environment
            ? {
                files: `/environments/${environment}`
              }
            : { preset: resolvedConfig?.environment })}
        />
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

  Comp.Layout = (props: any) => (
    <R3FCanvasLayout {...props} htmlChildren={<Loader />} />
  )

  return Comp
}
