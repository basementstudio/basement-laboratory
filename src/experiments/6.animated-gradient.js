import { Texture, Triangle, Vec2 } from 'ogl'
import * as React from 'react'
import { useFrame, useOGL } from 'react-ogl'

import { OGLCanvasLayout } from '../components/layout/ogl-canvas-layout'
import { fragment, vertex } from '../shaders/animated-gradient'

class TextureLoader extends Texture {
  load(src) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => (this.image = img)
    img.src = src
    return this
  }
}

const Gradient = () => {
  const meshRef = React.useRef()
  const { gl } = useOGL()
  const geometry = new Triangle(gl)

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
            value: new TextureLoader(gl).load('/images/gradient.jpg')
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
        style={{ height: '100vh' }}
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

export const title = 'Animated gradient'
export const description =
  'This is an animated gradient. Made with OGL & React-OGL'
Gradient.Tags = 'ogl,shaders'

export default Gradient
