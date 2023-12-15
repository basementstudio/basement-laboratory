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
    renderPass2.clear = false // Don't clear the readBuffer
    composer.addPass(renderPass2)

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
