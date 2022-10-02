import { Box } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

import { R3FCanvasLayout } from '../components/layout/r3f-canvas-layout'

const JustACube = () => {
  const boxRef = useRef()

  useEffect(() => {
    console.log('Effect with no deps')
  }, [])

  useFrame(() => {
    boxRef.current.rotation.x += 0.01
    boxRef.current.rotation.y += 0.01
  })

  return (
    <Box ref={boxRef}>
      <meshNormalMaterial />
    </Box>
  )
}

JustACube.Layout = R3FCanvasLayout
JustACube.Title = 'This is just a cube (example)'
JustACube.Description =
  'This is the simplest possible example of a React Three Fiber experiment.'
JustACube.Tags = 'example'

export default () => {
  return (
    <R3FCanvasLayout>
      <JustACube />
    </R3FCanvasLayout>
  )
}
