import { Triangle, Vec2 } from 'ogl'
import * as React from 'react'
import { useFrame, useOGL } from 'react-ogl'

import { OGLCanvasLayout } from '~/components/layout/ogl-canvas-layout'
import { useImageTextureLoader } from '~/hooks/ogl/useImageTextureLoader'
import { fragment, vertex } from '~/shaders/animated-gradient'

const Gradient = () => {
  const meshRef = React.useRef()
  const { gl } = useOGL()
  const geometry = new Triangle(gl)
  const texture = useImageTextureLoader('/images/gradient.jpg')

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.program.uniforms.uTime.value = delta * 0.0001
    }
  })

  return (
    <mesh ref={meshRef}>
      <program
        vertex={vertex}
        fragment={fragment}
        uniforms={{
          uTime: {
            value: 0
          },
          uGradient: {
            value: texture
          },
          uResolution: {
            value: new Vec2(window.innerWidth, window.innerHeight)
          }
        }}
      />
      <geometry {...geometry.attributes} />
    </mesh>
  )
}

Gradient.getLayout = ({ Component, title, description, slug }) => {
  return (
    <>
      <OGLCanvasLayout
        renderer={{ alpha: true, premultipliedAlpha: false }}
        title={title}
        description={description}
        slug={slug}
      >
        <Component />
      </OGLCanvasLayout>
    </>
  )
}

Gradient.Title = 'Animated gradient'
Gradient.Description = 'This is an animated gradient made with OGL & React-OGL'

export default Gradient
