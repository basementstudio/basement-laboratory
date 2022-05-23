import { Clone, OrbitControls, useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import { FC } from 'react'

const baseControls = {
  scale: 1
}

export const model = (path: string, config?: typeof baseControls): FC => {
  return () => {
    const model = useGLTF(`/models/${path}`)
    const { scale } = useControls({
      scale: {
        min: 0,
        step: 0.1,
        value: config?.scale || baseControls.scale,
        max: 10
      }
    })

    return (
      <>
        <OrbitControls />
        <group scale={scale}>
          {/*@ts-ignore*/}
          <Clone object={model.scene} scale={scale} />
        </group>
      </>
    )
  }
}
