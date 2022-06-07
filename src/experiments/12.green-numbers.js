import { Triangle, Vec3 } from 'ogl'
import * as React from 'react'
import { useFrame, useOGL } from 'react-ogl'

import { OGLCanvasLayout } from '../components/layout/ogl-canvas-layout'
import { fragment, vertex } from '../shaders/green-numbers'

const GreenNumbers = () => {
  const meshRef = React.useRef()
  const { gl } = useOGL()
  const geometry = new Triangle(gl)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.program.uniforms.uTime.value = delta * 0.0008
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
          uResolution: {
            value: new Vec3(window.innerWidth, window.innerHeight, 0)
          }
        }}
      />
      <geometry {...geometry.attributes} />
    </mesh>
  )
}

GreenNumbers.getLayout = ({ Component, title, description, slug }) => {
  return (
    <>
      <OGLCanvasLayout
        style={{ height: 'calc(var(--vh) * 100)' }}
        dpr={[0.6, 1]}
        title={title}
        description={description}
        slug={slug}
      >
        <Component />
      </OGLCanvasLayout>
    </>
  )
}

GreenNumbers.Title = 'Green numbers'
GreenNumbers.Description =
  'Green numbers shader from shadertoy. Made with OGL & React-OGL.'
GreenNumbers.Tags = 'ogl,shaders'

export default GreenNumbers
