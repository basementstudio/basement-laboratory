import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { gsap } from 'lib/gsap'
import { clamp } from 'lodash'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import { useRenderTargets } from '~/hooks/use-render-target'
import { useUniforms } from '~/hooks/use-uniforms'

/* Vertex and fragment shader strings for a radial gradient */
// eslint-disable-next-line prettier/prettier
const brushVertexShader =/* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
/* Fragment shader strings for a rgb rainbow gradient */
// eslint-disable-next-line prettier/prettier
const brushFragmentShader =/* glsl */  `
  varying vec2 vUv; 
  uniform float uTime;
  void main() {
    vec2 uv = vUv;
   
    float time = uTime * 0.5;
    float r = sin(time) * 0.5 + 0.5;
    float g = sin(time + 2.094) * 0.5 + 0.5;
    float b = sin(time + 4.188) * 0.5 + 0.5;
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`
// eslint-disable-next-line prettier/prettier
const bgVertexShader =/* glsl */  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
// eslint-disable-next-line prettier/prettier
const bgFragmentShader =/* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform sampler2D uDisp;
  uniform float uTime;
  uniform float uSpeed;
  uniform vec2 uManualDisp;

  void main() {
    vec2 uv = vUv;

    gl_FragColor = texture2D(uTexture, uv + uManualDisp * uSpeed);
  }
`

const InfiniteRender = () => {
  const dispTexture = useTexture('/textures/disp.png')
  const circleRef = useRef()
  const bgTrgtRef = useRef()
  const materialTrgtRef = useRef()
  const mainSceneRef = useRef()
  const materialSceneRef = useRef()
  const { viewport } = useThree((s) => ({
    viewport: s.viewport
  }))
  const [trgt, trgt1] = useRenderTargets(2, {
    format: THREE.RGBAFormat
  })

  const brushUniforms = useUniforms({
    uTime: { value: 0 }
  })
  const bgUniforms = useUniforms({
    uTexture: { value: null },
    uDisp: { value: dispTexture },
    uTime: { value: 0 },
    uSpeed: { value: 1 },
    uManualDisp: { value: new THREE.Vector2(0, 0) }
  })

  useFrame((s) => {
    if (!circleRef.current || !bgTrgtRef.current || !mainSceneRef.current) {
      return
    }

    brushUniforms.current.uTime.value += 0.01
    bgUniforms.current.uTime.value += 0.01
    bgUniforms.current.uManualDisp.value.set(
      clamp(s.mouse.x * 0.005, -0.01, 0.01),
      clamp(s.mouse.y * 0.005, -0.01, 0.01)
    )

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

  useEffect(() => {
    const handleDown = () => {
      gsap.to(bgUniforms.current.uSpeed, {
        value: 2
      })
    }
    const handleUp = () => {
      gsap.to(bgUniforms.current.uSpeed, {
        value: 1
      })
    }
    window.addEventListener('pointerdown', handleDown)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [bgUniforms])

  return (
    <>
      <scene name="material-scene" ref={materialSceneRef}>
        <mesh position={[0, 0, -0.5]} ref={materialTrgtRef}>
          <planeGeometry args={[viewport.width, viewport.height]} />
          <shaderMaterial
            vertexShader={bgVertexShader}
            fragmentShader={bgFragmentShader}
            uniforms={bgUniforms.current}
            side={THREE.DoubleSide}
            transparent={true}
          />
        </mesh>
      </scene>

      <scene name="main-scene" ref={mainSceneRef}>
        <mesh ref={bgTrgtRef}>
          <planeGeometry args={[viewport.width, viewport.height]} />
          <meshBasicMaterial />
        </mesh>
        <mesh ref={circleRef}>
          <circleGeometry args={[25, 32 * 2]} />
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
InfiniteRender.Description = (
  <>
    Infinite render technique using multiple render targets based on{' '}
    <a target="_blank" href="https://youtu.be/nf6e13wSMug" rel="noopener">
      Yuris video.
    </a>
    <br />
    <br />
    <p>
      <strong>Controls:</strong>
    </p>
    <ul>
      <li>
        <strong>Click </strong>to speed up
      </li>
    </ul>
  </>
)
InfiniteRender.Layout = (props) => {
  return (
    <R3FCanvasLayout
      {...props}
      gl={{
        alpha: true,
        antialias: true,
        format: THREE.RGBAFormat,
        outputEncoding: THREE.sRGBEncoding,
        physicallyCorrectLights: true,
        toneMapping: THREE.NoToneMapping
      }}
      orthographic
    />
  )
}
export default InfiniteRender
