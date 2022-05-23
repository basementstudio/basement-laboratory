import { Clone, OrbitControls, useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import { FC } from 'react'

export const model = (path: string): FC => {
  return () => {
    const model = useGLTF(`/models/${path}`)
    const { scale } = useControls({
      scale: {
        min: 0,
        step: 0.1,
        value: 1,
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
