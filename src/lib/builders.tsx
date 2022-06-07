import { Center, OrbitControls, useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import { FC } from 'react'

const baseControls = {
  scale: 1,
  ambientLight: 1
}

export const model = (path: string, config?: typeof baseControls): FC => {
  return () => {
    const model = useGLTF(`/models/${path}`)
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
      }
    })

    return (
      <>
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
