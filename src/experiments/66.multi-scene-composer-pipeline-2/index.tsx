import { Box, OrbitControls } from '@react-three/drei'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader'

// import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader'
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

  /* Final Composer */
  const [finalComposer] = useState(() => {
    const composer = new EffectComposer(gl)

    composer.renderToScreen = true

    const renderPass1 = new RenderPass(firstScene, defaultCamera)
    /* THIS ONE SHOULD CLEAR! */
    renderPass1.clear = true
    composer.addPass(renderPass1)

    const renderPass2 = new RenderPass(secondScene, defaultCamera)
    /* THIS ONE SHOULD'T CLEAR */
    renderPass2.clear = false
    composer.addPass(renderPass2)

    // const rgbShiftPass = new ShaderPass(RGBShiftShader)
    // rgbShiftPass.clear = false
    // composer.addPass(rgbShiftPass)

    /*
      We need to use this CopyPass to prevent the "renderPass2"
      from writing to screen and force it using the swapped buffer.
    */
    const copyPass = new ShaderPass(CopyShader)
    composer.addPass(copyPass)

    return composer
  })

  useFrame(() => {
    // gl.clear(true, true, true)

    // blurPassUniforms.uTime.value = s.clock.getElapsedTime()

    // firstComposer.render()
    // secondComposer.render()

    finalComposer.render()
  }, 0)

  return (
    <>
      <OrbitControls />

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
        autoClear: false,
        depth: false,
        antialias: false,
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
