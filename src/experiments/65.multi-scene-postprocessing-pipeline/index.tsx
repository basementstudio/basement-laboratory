import { Box, OrbitControls, useTexture } from '@react-three/drei'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader'

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
  const dummytxt = useTexture('/textures/texture-debugger.jpg')

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

  const [rt2] = useState(() => {
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

  /* 1st Composer */
  const [firstComposer] = useState(() => {
    const composer = new EffectComposer(gl, rt1)

    /* Disable render to screen */
    composer.renderToScreen = false

    const renderPass = new RenderPass(firstScene, defaultCamera)
    composer.addPass(renderPass)

    // const dotScreen = new ShaderPass(DotScreenShader)
    // dotScreen.uniforms['scale'].value = 2
    // composer.addPass(dotScreen)

    const copyPass = new ShaderPass(CopyShader)

    composer.addPass(copyPass)

    // const rgbShift = new ShaderPass(RGBShiftShader)
    // rgbShift.uniforms['amount'].value = 0.0015
    // composer.addPass(rgbShift)

    return composer
  })

  /* 2nd Composer */
  const [secondComposer] = useState(() => {
    const composer = new EffectComposer(gl, rt2)

    composer.renderToScreen = false

    const renderPass = new RenderPass(secondScene, defaultCamera)
    composer.addPass(renderPass)

    return composer
  })

  /* Final Composer */
  const [finalComposer] = useState(() => {
    const composer = new EffectComposer(gl)

    composer.renderToScreen = true

    /* Shaderpass that blends first and second composers togheter and applies motion blur */
    const shaderPass = new ShaderPass({
      uniforms: {
        tFirst: { value: null },
        tSecond: { value: null },
        tDepthFirst: { value: null },
        tDepthSecond: { value: null },
        uCameraNear: { value: null },
        uCameraFar: { value: null }
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        #include <packing>

        uniform sampler2D tFirst;
        uniform sampler2D tSecond;
        uniform sampler2D tDepthFirst;
        uniform sampler2D tDepthSecond;
        uniform float uCameraNear;
        uniform float uCameraFar;

        varying vec2 vUv;

        float readDepth( sampler2D depthSampler, vec2 coord ) {
          float fragCoordZ = texture2D( depthSampler, coord ).x;
          float viewZ = perspectiveDepthToViewZ( fragCoordZ, uCameraNear, uCameraFar );
          return viewZToOrthographicDepth( viewZ, uCameraNear, uCameraFar );
        }

        void main() {
          float depthFirst = readDepth( tDepthFirst, vUv );
          float depthSecond = readDepth( tDepthSecond, vUv );

          vec4 firstColor = texture2D(tFirst, vUv);
          vec4 secondColor = texture2D(tSecond, vUv);
        
          gl_FragColor.rgb = 1.0 - vec3( depthSecond );
			  	gl_FragColor.a = 1.0;

          /* occlude tSecond based on depth */
          if (depthFirst < depthSecond) {
            gl_FragColor = firstColor;
          } else {
            gl_FragColor = secondColor;
          }

          // gl_FragColor = vec4(depthFirst, depthFirst, depthFirst, 1.0);
        }
      `
    })

    // const afterimagePass = new AfterimagePass()

    shaderPass.renderToScreen = true
    shaderPass.uniforms.tFirst.value = firstComposer.readBuffer.texture
    shaderPass.uniforms.tSecond.value = secondComposer.readBuffer.texture
    shaderPass.uniforms.uCameraNear.value = defaultCamera.near
    shaderPass.uniforms.uCameraFar.value = defaultCamera.far
    shaderPass.uniforms.tDepthFirst.value =
      firstComposer.readBuffer.depthTexture
    shaderPass.uniforms.tDepthSecond.value =
      secondComposer.readBuffer.depthTexture

    composer.addPass(shaderPass)

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

    composer.addPass(blurPass)

    return composer
  })

  useFrame((s) => {
    gl.clear(true, true, true)

    blurPassUniforms.uTime.value = s.clock.getElapsedTime()

    firstComposer.render()
    secondComposer.render()

    finalComposer.render()
  }, 0)

  const DEBUG_VIEWER_MARGIN = 16

  return (
    <>
      <DebugTextureViewer
        texture={firstComposer.readBuffer.depthTexture}
        offset={[0, (128 + DEBUG_VIEWER_MARGIN) * 0]}
      />
      <DebugTextureViewer
        texture={secondComposer.readBuffer.depthTexture}
        offset={[0, (128 + DEBUG_VIEWER_MARGIN) * 1]}
      />
      <DebugTextureViewer
        texture={dummytxt}
        offset={[0, (128 + DEBUG_VIEWER_MARGIN) * 2]}
      />

      <OrbitControls />

      {/* First Scene */}
      {createPortal(
        <group position={[-1, 0, 0]}>
          <Box>
            <meshBasicMaterial attach="material" color="red" />
          </Box>
        </group>,
        firstScene
      )}

      {/* Second Scene */}
      {createPortal(
        <group position={[1, 0, 0]}>
          <Box>
            <meshBasicMaterial attach="material" color="blue" />
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
        autoClear: false,
        depth: true,
        alpha: true
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
