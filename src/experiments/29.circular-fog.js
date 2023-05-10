import { Center, Environment, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { folder, Leva, useControls } from 'leva'
import { useEffect, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

import { Loader, useLoader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import { useUniforms } from '~/hooks/use-uniforms'

import { DURATION, gsap } from '../lib/gsap'
import { trackCursor } from '../lib/three'

const MODEL_NAME = 'KJ_Web_Scene.glb'

const fogParsVert = `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vPosition;
#endif
`

const fogVert = `
#ifdef USE_FOG
  /*
    You only have to multiply it by the modelMatrix, bc we DON'T want any matrix
    transformation based on camera pos. That way we can fix it to world pos.
    
    https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram
  */
  vPosition = (modelMatrix * vec4( position, 1.0 )).xyz;
#endif
`

const fogFrag = `
#ifdef USE_FOG
  vec2 centerPos = vec2(uFogCenterX, uFogCenterZ);
  vec2 toCenter = centerPos - vPosition.xz;

  float vFogDepth = (1.0) * distance(toCenter, vPosition.xz);
  
  float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
  
  gl_FragColor.rgb = mix( gl_FragColor.rgb, mix(uFogNearColor, fogColor, fogFactor), fogFactor);
#endif

`

const fogParsFrag = `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vPosition;

  uniform float fogFar;
  uniform float fogNear;
  uniform vec3 fogColor;
  uniform vec3 uFogNearColor;
  uniform float uFogCenterX;
  uniform float uFogCenterZ;
#endif
`

const KarlBg = () => {
  const finishedEntrance = useRef(false)
  const { camera, scene, gl } = useThree()
  const { loading, setLoaded } = useLoader(({ setLoaded, loading }) => ({
    loading,
    setLoaded
  }))

  const config = useControls({
    model: folder(
      {
        scale: { value: 0.6, step: 0.01, min: 0, max: 2 }
      },
      { collapsed: true }
    ),
    scene: folder(
      {
        ambientLight: { value: 0.1, step: 0.01, min: 0, max: 1 },
        ambientLightColor: { value: '#fff' },
        background: { value: '#000' },
        environment: { value: 'sunset' }
      },
      { collapsed: true }
    ),
    camera: folder(
      {
        camXPosition: {
          value: -2,
          step: 0.5,
          min: -10,
          max: 50
        },
        camYPosition: {
          value: 70,
          step: 0.5,
          min: 0,
          max: 100
        },
        camZPosition: {
          value: 70,
          step: 0.5,
          min: -30,
          max: 100
        },
        camXRotation: {
          value: -Math.PI * 0.25,
          min: -Math.PI * 2,
          max: Math.PI * 2
        },
        camYRotation: { value: 0, min: -Math.PI * 2, max: Math.PI * 2 },
        camZRotation: { value: 0, min: -Math.PI * 2, max: Math.PI * 2 },
        camRotationMultiplierX: { value: 0.01, min: 0, max: 1 },
        camRotationMultiplierY: { value: 0.01, min: 0, max: 1 }
      },
      { collapsed: true }
    ),
    fog: folder({
      uFogNear: { value: 55, min: 0, max: 500 },
      uFogFar: { value: 140, min: 0, max: 500 },
      uFogCenter: { value: { x: 0, z: -20 }, min: -500, max: 500 },
      uFogNearColor: { value: '#000' },
      uFogHorizonColor: { value: '#000' }
    })
  })

  const uniforms = useUniforms(
    {
      uFogNearColor: { value: new THREE.Color(config.uFogNearColor) },
      uFogCenterX: { value: config.uFogCenter.x },
      uFogCenterZ: { value: config.uFogCenter.z }
    },
    config,
    {
      middlewares: {
        uFogNearColor: (curr, input) => {
          curr?.set(input)
        },
        uFogCenter: (_, input) => {
          uniforms.current['uFogCenterX'].value = input.x
          uniforms.current['uFogCenterZ'].value = input.z
        }
      },
      exclude: ['uFogHorizonColor', 'uFogCenterX', 'uFogCenterZ']
    }
  )

  const model = useGLTF(
    `/models/${MODEL_NAME}`,
    undefined,
    undefined,
    (loader) => {
      loader.manager.onLoad = () => setLoaded()
    }
  )

  useLayoutEffect(() => {
    /* Floor size */
    const floorScaleFactor = 4
    const floor = model.nodes['Plane']
    floor.material.map.repeat.set(floorScaleFactor, floorScaleFactor)

    const patch = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        `#include <fog_pars_vertex>`,
        fogParsVert
      )
      shader.vertexShader = shader.vertexShader.replace(
        `#include <fog_vertex>`,
        fogVert
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <fog_pars_fragment>`,
        fogParsFrag
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <fog_fragment>`,
        fogFrag
      )

      Object.keys(uniforms.current).map((key) => {
        shader.uniforms[key] = uniforms.current[key]
      })
    }

    /* Patch all scene materials */
    scene.traverse((e) => {
      if (e.material) {
        e.material.onBeforeCompile = patch
      }
    })

    scene.fog = new THREE.Fog(config.uFogHorizonColor, 0, 0)
  }, [])

  useLayoutEffect(() => {
    camera.position.set(
      config.camXPosition,
      config.camYPosition,
      config.camZPosition
    )

    camera.rotation.set(
      config.camXRotation,
      config.camYRotation,
      config.camZRotation
    )

    if (finishedEntrance.current) {
      scene.fog.near = config.uFogNear
      scene.fog.far = config.uFogFar
    }

    scene?.fog?.color?.set(config.uFogHorizonColor)

    const mouseTracker = trackCursor((cursor) => {
      gsap.to(camera.rotation, {
        overwrite: true,
        duration: DURATION / 2.5,
        x:
          config.camXRotation +
          cursor.y * (Math.PI * config.camRotationMultiplierX),
        y:
          config.camYRotation +
          -cursor.x * (Math.PI * config.camRotationMultiplierY),
        ease: 'power2.out'
      })

      gsap.to(uniforms.current.uFogCenterX, {
        overwrite: true,
        duration: DURATION / 2.5,
        value: config.uFogCenter.x + cursor.x * 25,
        ease: 'power2.out'
      })

      gsap.to(uniforms.current.uFogCenterZ, {
        overwrite: true,
        duration: DURATION / 1.5,
        value: config.uFogCenter.z + -cursor.y * 25,
        ease: 'power2.out'
      })
    }, gl.domElement)

    return () => {
      mouseTracker.destroy()
    }
  }, [config, scene.fog, camera])

  useEffect(() => {
    if (scene.fog && !loading) {
      const duration = DURATION * 3.5

      gsap.to(camera.position, {
        y: config.camYPosition,
        delay: 1,
        duration
      })
      gsap.to(scene.fog, {
        near: config.uFogNear,
        far: config.uFogFar,
        ease: 'power2.out',
        delay: 1,
        duration,
        onComplete: () => {
          finishedEntrance.current = true
        }
      })
    }
  }, [loading])

  return (
    <>
      <color attach="background" args={[config.background]} />
      <Environment preset={config?.environment} />
      <ambientLight
        intensity={config?.ambientLight}
        color={config.ambientLightColor}
      />

      <Center>
        <group scale={config?.scale}>
          <primitive scale={4} object={model.nodes.Plane} />
          <primitive object={model.nodes.tv} />
          <primitive object={model.nodes.Gc} />
          <primitive object={model.nodes.Controller} />
          <primitive object={model.nodes.VHSPlayer} />
          <primitive object={model.nodes.Cube} />
          <primitive object={model.nodes.Cube1} />
          <primitive object={model.nodes.Packs} />
          <primitive object={model.nodes.Cards} />
        </group>
      </Center>
    </>
  )
}

KarlBg.Layout = (props) => (
  <>
    <Leva />
    <R3FCanvasLayout {...props} htmlChildren={<Loader />} />
  </>
)

export const title = 'Circular Fog Shader'
KarlBg.Tags = 'shaders'
export const description = (
  <>
    <p>
      <strong>Motivation:</strong> We were looking for a spotlight effect that
      highlights only the elements in the middle of the scene.
    </p>

    <p>
      <strong>How we did it:</strong> We've modified the predefined fog shader
      behavior to fit our needs. Inspired by{' '}
      <a
        href="https://snayss.medium.com/three-js-fog-hacks-fc0b42f63386"
        target="_blank"
        rel="noopener"
      >
        this post
      </a>
      .
    </p>
  </>
)

export default KarlBg
