import { Box, OrbitControls } from '@react-three/drei'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

/* 
  Objective:
  Get two separate scenes to render to the same canvas, applying postprocessing to each scene separately.
  And then apply postprocessing to the entire canvas.
*/

const MultiScenePostpo = () => {
  const gl = useThree((state) => state.gl)
  const defaultCamera = useThree((state) => state.camera)

  const [firstScene] = useState(() => new THREE.Scene())
  const [secondScene] = useState(() => new THREE.Scene())

  /* 1st Composer */
  const [firstComposer] = useState(() => {
    const composer = new EffectComposer(gl)

    /* Setup depth */
    const depthTexture = new THREE.DepthTexture(
      gl.domElement.width,
      gl.domElement.height
    )
    depthTexture.type = THREE.UnsignedShortType
    depthTexture.minFilter = THREE.NearestFilter
    depthTexture.magFilter = THREE.NearestFilter
    depthTexture.format = THREE.DepthFormat
    depthTexture.generateMipmaps = false

    /* Implement depth texture */
    composer.readBuffer.depthBuffer = true
    composer.readBuffer.depthTexture = depthTexture

    /* Disable render to screen */
    composer.renderToScreen = false

    const renderPass = new RenderPass(firstScene, defaultCamera)
    composer.addPass(renderPass)

    return composer
  })

  /* 2nd Composer */
  const [secondComposer] = useState(() => {
    const composer = new EffectComposer(gl)

    /* Setup depth */
    const depthTexture = new THREE.DepthTexture(
      gl.domElement.width,
      gl.domElement.height
    )
    depthTexture.type = THREE.UnsignedShortType
    depthTexture.minFilter = THREE.NearestFilter
    depthTexture.magFilter = THREE.NearestFilter
    depthTexture.format = THREE.DepthFormat
    depthTexture.generateMipmaps = false

    /* Implement depth texture */
    composer.readBuffer.depthBuffer = true
    composer.readBuffer.depthTexture = depthTexture

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
        }
      `
    })

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

    return composer
  })

  useFrame(() => {
    gl.clear(true, true, true)

    firstComposer.render()
    secondComposer.render()

    finalComposer.render()
  }, 0)

  return (
    <>
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
        depth: false,
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
