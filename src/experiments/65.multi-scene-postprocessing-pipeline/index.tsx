import { Box, OrbitControls, useTexture } from '@react-three/drei'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
// import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader'
// import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader'
import { create } from 'zustand'

import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

const previousScissor = new THREE.Vector4()
const previousViewport = new THREE.Vector4()

type UseDebugTextureViewerScreenSlotState = {
  slots: Map<number, THREE.Vector4>
  getSlot: (id: number, width: number, height: number) => THREE.Vector4
  freeSlot: (id: number) => void
}

const useDebugTextureViewerScreenSlot =
  create<UseDebugTextureViewerScreenSlotState>((_, get) => ({
    slots: new Map<number, THREE.Vector4>(),
    getSlot: (id: number, width: number, height: number) => {
      const slots = get().slots

      if (slots.has(id)) {
        return slots.get(id) as THREE.Vector4
      }

      /* Find a free slot */
      for (const [id, slot] of slots) {
        if (slot.z >= width && slot.w >= height) {
          /* Found a slot */
          slots.set(
            id,
            new THREE.Vector4(slot.x + width, slot.y, slot.z, height)
          )
          return new THREE.Vector4(slot.x, slot.y, width, height)
        }
      }

      console.warn(
        'useDebugTextureViewerScreenSlot: no free slot found for id:',
        id
      )

      return new THREE.Vector4()
    },
    freeSlot: (id: THREE.Texture['id']) => {
      const slots = get().slots
      slots.delete(id)
    }
  }))

const RenderScissorSlot = ({
  id,
  width,
  height,
  offset = [0, 0]
}: {
  id: number
  width: number
  height: number
  offset?: [number, number]
}) => {
  const screenSlot = useDebugTextureViewerScreenSlot()

  /* wip */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const scissorSlot = screenSlot.getSlot(id, width, height)

  useFrame((s) => {
    const previousSissorTest = s.gl.getScissorTest()
    s.gl.getScissor(previousScissor)
    s.gl.getViewport(previousViewport)

    const left = previousViewport.z - width - offset[0]
    const bottom = previousViewport.w - height - offset[1]

    s.gl.setViewport(left, bottom, width, height)
    s.gl.setScissor(left, bottom, width, height)
    s.gl.setScissorTest(true)

    s.gl.render(s.scene, s.camera)

    /* Revert */
    s.gl.setViewport(
      previousViewport.x,
      previousViewport.y,
      previousViewport.z,
      previousViewport.w
    )
    s.gl.setScissor(
      previousScissor.x,
      previousScissor.y,
      previousScissor.z,
      previousScissor.w
    )
    s.gl.setScissorTest(previousSissorTest)
  }, 1)

  return <></>
}

const DebugTextureViewer = ({
  texture,
  offset
}: {
  texture: THREE.Texture | THREE.DepthTexture
  offset?: [number, number]
}) => {
  const [virtualScene] = useState(() => new THREE.Scene())
  const [quadCam] = useState(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  )
  const aspect = texture.image.width / texture.image.height
  const height = 128

  return (
    <>
      {/* @ts-ignore */}
      {createPortal(
        <>
          <color attach="background" args={['#f00']} />
          <RenderScissorSlot
            id={texture.id}
            width={height * aspect}
            height={height}
            offset={offset}
          />
          <mesh>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
              defines={{
                // eslint-disable-next-line no-prototype-builtins
                ...(texture.hasOwnProperty('isDepthTexture')
                  ? { IS_DEPTH: '' }
                  : {})
              }}
              uniforms={{
                tDiffuse: { value: texture }
              }}
              vertexShader={
                /* glsl */ `
                varying vec2 vUv;

                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `
              }
              fragmentShader={
                /* glsl */ `
                varying vec2 vUv;

                uniform sampler2D tDiffuse;

                void main() {
                  vec4 texel = texture2D(tDiffuse, vUv);

                  #ifdef IS_DEPTH
                    gl_FragColor = vec4(vec3(texel.r), 1.0);
                  #else
                    gl_FragColor = texel;
                  #endif
                }
              `
              }
            />
          </mesh>
        </>,
        virtualScene,
        {
          camera: quadCam,
          frameloop: 'never'
        }
      )}
    </>
  )
}

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

  /* 1st Composer */
  const [firstComposer] = useState(() => {
    const composer = new EffectComposer(gl)

    /* Setup depth */
    const depthTexture = new THREE.DepthTexture(
      gl.domElement.width,
      gl.domElement.height
    )
    depthTexture.type = THREE.UnsignedIntType
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

    // const dotScreen = new ShaderPass(DotScreenShader)
    // dotScreen.uniforms['scale'].value = 2
    // composer.addPass(dotScreen)

    // const rgbShift = new ShaderPass(RGBShiftShader)
    // rgbShift.uniforms['amount'].value = 0.0015
    // composer.addPass(rgbShift)

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
