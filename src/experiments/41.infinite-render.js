import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

import { useRenderTargets } from '~/hooks/use-render-target'
import { useUniforms } from '~/hooks/use-uniforms'

/* Vertex and fragment shader strings for a radial gradient */
const brushVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
/* Fragment shader strings for a rgb rainbow gradient */
const brushFragmentShader = `
  varying vec2 vUv; 
  uniform float uTime;
  void main() {
    vec2 uv = vUv;
    float radius = 0.5;
    float dist = distance(uv, vec2(0.5));
    float alpha = smoothstep(radius, radius - 0.01, dist);
    float time = uTime * 0.5;
    float r = sin(time) * 0.5 + 0.5;
    float g = sin(time + 2.094) * 0.5 + 0.5;
    float b = sin(time + 4.188) * 0.5 + 0.5;
    gl_FragColor = vec4(r, g, b, alpha);
  }
`

const bgVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const bgFragmentShader = `
  varying vec2 vUv;
  uniform sampler2D uTexture;

  void main() {
    vec2 uv = vUv;
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    gl_FragColor = texture2D(uTexture, uv + vec2(.0, -.001));
  }
`

const InfiniteRender = () => {
  const circleRef = useRef()
  const bgTrgtRef = useRef()
  const materialTrgtRef = useRef()
  const mainSceneRef = useRef()
  const materialSceneRef = useRef()
  const viewport = useThree((s) => s.viewport)
  const [trgt, trgt1] = useRenderTargets(2, {
    format: THREE.RGBAFormat
    // magFilter: THREE.NearestFilter,
    // minFilter: THREE.NearestFilter
  })

  const brushUniforms = useUniforms({
    uTime: { value: 0 }
  })
  const bgUniforms = useUniforms({
    uTexture: { value: null }
  })

  useFrame((s) => {
    if (!circleRef.current || !bgTrgtRef.current || !mainSceneRef.current) {
      return
    }

    brushUniforms.current.uTime.value += 0.01
    circleRef.current.position.set(
      s.mouse.x * (viewport.width / 2),
      s.mouse.y * (viewport.height / 2),
      0
    )

    s.gl.setRenderTarget(trgt)
    s.gl.render(mainSceneRef.current, s.camera)

    s.gl.setRenderTarget(trgt1)
    materialTrgtRef.current.material.uniforms.uTexture.value = trgt.texture
    s.gl.render(materialSceneRef.current, s.camera)

    s.gl.setRenderTarget(null)
    bgTrgtRef.current.material.map = trgt1.texture
    s.gl.render(mainSceneRef.current, s.camera)
  }, 1)

  return (
    <>
      <scene name="material-scene" ref={materialSceneRef}>
        <mesh ref={materialTrgtRef}>
          <planeGeometry args={[viewport.width, viewport.height]} />
          <shaderMaterial
            vertexShader={bgVertexShader}
            fragmentShader={bgFragmentShader}
            uniforms={bgUniforms.current}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
      </scene>

      <scene name="main-scene" ref={mainSceneRef}>
        {/* Set background color */}
        <color attach="background" args={['#000']} />
        <mesh ref={bgTrgtRef}>
          <planeGeometry args={[viewport.width, viewport.height]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh ref={circleRef}>
          <circleGeometry args={[0.25, 32 * 2]} />
          <shaderMaterial
            vertexShader={brushVertexShader}
            fragmentShader={brushFragmentShader}
            uniforms={brushUniforms.current}
          />
        </mesh>
      </scene>
    </>
  )
}

InfiniteRender.Title = 'InfiniteRender Technique'
InfiniteRender.Description =
  'Infinite render technique using multiple render targets based on: https://youtu.be/nf6e13wSMug'

export default InfiniteRender
