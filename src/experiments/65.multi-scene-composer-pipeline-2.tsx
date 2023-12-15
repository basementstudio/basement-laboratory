import { Box, OrbitControls } from '@react-three/drei'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader'

import { DebugTextureViewer } from '~/components/common/texture-debugger'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

/* 
  Objective:
  Get two separate scenes to render to the same canvas, applying postprocessing to each scene separately.
  And then apply postprocessing to the entire canvas.
*/

const blurPassUniforms = {
  uTime: { value: 0 },
  tDiffuse: { value: null }
}

const MultiScenePostpo = () => {
  const gl = useThree((state) => state.gl)
  const defaultCamera = useThree((state) => state.camera)

  const [firstScene] = useState(() => new THREE.Scene())
  const [secondScene] = useState(() => new THREE.Scene())

  const [rt1] = useState(() => {
    const target = new THREE.WebGLRenderTarget(
      gl.domElement.width,
      gl.domElement.height,
      {
        depthBuffer: true,
        depthTexture: new THREE.DepthTexture(
          gl.domElement.width,
          gl.domElement.height
        )
      }
    )
    return target
  })

  /* Final Composer */
  const [finalComposer] = useState(() => {
    const composer = new EffectComposer(gl, rt1)

    const renderPass = new RenderPass(firstScene, defaultCamera)
    composer.addPass(renderPass)

    const rgbShiftPass = new ShaderPass(RGBShiftShader)
    rgbShiftPass.clear = false
    /* Prevent the fsQuad from modifying the depthBuffer */
    rgbShiftPass.fsQuad.material.depthWrite = false
    rgbShiftPass.fsQuad.material.depthTest = false
    rgbShiftPass.uniforms['amount'].value = 0.005
    composer.addPass(rgbShiftPass)

    const renderPass2 = new RenderPass(secondScene, defaultCamera)
    rgbShiftPass.fsQuad.material.depthWrite = false
    rgbShiftPass.fsQuad.material.depthTest = false
    renderPass2.clear = false // Don't clear the readBuffer
    composer.addPass(renderPass2)

    const blurPass = new ShaderPass({
      uniforms: blurPassUniforms,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;

        uniform sampler2D tDiffuse;
        uniform float uTime;

        // #define JITTER
        // #define MOUSE

        float hash(in vec2 p) {
          return fract(
            sin(
              dot(
                p,
                vec2(283.6, 127.1)
              )
            ) * 43758.5453
          );
        }

        #define CENTER vec2(.5)

        #define SAMPLES 10
        #define RADIUS .025

        void main() {
          vec2 uv = vUv;
          vec3 res = vec3(0);

          for(int i = 0; i < SAMPLES; ++i) {
            res += texture2D(tDiffuse, uv).rgb;

            vec2 d = CENTER - uv;

            // #ifdef JITTER
            //   d *= .5 + .01 * hash(d * uTime);
            // #endif

            uv += d * RADIUS;
          }

          gl_FragColor = vec4(res / float(SAMPLES), 1.0);
          // gl_FragColor = vec4(vec3(1.0, 0.0, 0.0), 1.0);
        }
      `
    })
    blurPass.fsQuad.material.depthWrite = false

    composer.addPass(blurPass)

    const outputPass = new OutputPass()
    composer.addPass(outputPass)

    return composer
  })

  useFrame(() => {
    finalComposer.render()
  }, 0)

  return (
    <>
      <OrbitControls />

      <DebugTextureViewer
        height={256}
        texture={finalComposer.renderTarget1.depthTexture}
        offset={[0, 0]}
      />

      {/* First Scene */}
      {createPortal(
        <group position={[-1, 0, 0]}>
          <Box>
            <meshBasicMaterial attach="material" color="white" />
          </Box>
        </group>,
        firstScene
      )}

      {/* Second Scene */}
      {createPortal(
        <group position={[1, 0, 0]}>
          <Box>
            <meshBasicMaterial attach="material" color="pink" />
          </Box>
        </group>,
        secondScene
      )}
    </>
  )
}

MultiScenePostpo.Layout = (props: any) => (
  <>
    <R3FCanvasLayout
      gl={{
        antialias: false,
        autoClear: false,
        alpha: false,
        powerPreference: 'high-performance',
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.NoToneMapping
      }}
      camera={{
        near: 0.1,
        far: 10
      }}
      {...props}
    />
  </>
)
MultiScenePostpo.Title = 'Multi Scene Postprocessing Pipeline'
MultiScenePostpo.Description = '-'

export default MultiScenePostpo
