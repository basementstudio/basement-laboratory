import { Center, Environment, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

import { Loader, useLoader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

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
    You only have to multiply it by the modelMatrix, bc we DON'T want matrix based on camera pos
    https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram
  */
  vPosition = (modelMatrix * vec4( position, 1.0 )).xyz;
#endif
`

const fogFrag = `
#ifdef USE_FOG
  vec2 centerPos = vec2(centerX, centerZ);
  vec2 toCenter = centerPos - vPosition.xz;

  float vFogDepth = (1.0) * distance(toCenter, vPosition.xz);
  
#ifdef FOG_EXP2
float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
#else
  
  float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
  
#endif
  

  gl_FragColor.rgb = mix( gl_FragColor.rgb, mix(fogNearColor, fogColor, fogFactor), fogFactor);
#endif

`

const fogParsFrag = `
#ifdef USE_FOG
	uniform vec3 fogColor;
  uniform vec3 fogNearColor;
	varying float vFogDepth;
  varying vec3 vPosition;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
    uniform float centerX;
    uniform float centerZ;
	#endif
  varying vec3 vFogWorldPosition;
  uniform float time;
  uniform float fogNoiseSpeed;
  uniform float fogNoiseFreq;
  uniform float fogNoiseImpact;
#endif
`

var params = {
  fogNearColor: 0x000,
  fogHorizonColor: 0x000,
  fogDensity: 0.01,
  fogNoiseSpeed: 100,
  fogNoiseFreq: 0.0012,
  fogNoiseImpact: 0.5
}

const KarlBg = () => {
  const cardsRef = useRef([])
  const { camera, scene } = useThree()
  const setLoaded = useLoader((s) => s.setLoaded)

  const config = useControls({
    scale: { value: 0.6, step: 0.01, min: 0, max: 2 },
    ambientLight: { value: 0.1, step: 0.01, min: 0, max: 1 },
    ambientLightColor: { value: '#fff' },
    background: { value: '#000' },
    environment: { value: 'sunset' },
    camXPosition: {
      value: -2,
      step: 0.5,
      min: -10,
      max: 10
    },
    camYPosition: {
      value: 17,
      step: 0.5,
      min: 0,
      max: 30
    },
    camZPosition: {
      value: 18,
      step: 0.5,
      min: 0,
      max: 30
    },
    camXRotation: {
      value: -Math.PI / 2.8,
      min: -Math.PI * 2,
      max: Math.PI * 2
    },
    camYRotation: { value: 0, min: -Math.PI * 2, max: Math.PI * 2 },
    camZRotation: { value: 0, min: -Math.PI * 2, max: Math.PI * 2 },
    camRotationMultiplierX: { value: 0.05, min: 0, max: 1 },
    camRotationMultiplierY: { value: 0.05, min: 0, max: 1 },
    fogNear: { value: 85, min: 0, max: 1000 },
    fogFar: { value: 230, min: 0, max: 1000 },
    centerX: { value: 0, min: -1000, max: 1000 },
    centerZ: { value: 0, min: -1000, max: 1000 }
  })

  const uniforms = useRef({
    fogNearColor: { value: new THREE.Color(params.fogNearColor) },
    centerX: { value: config.centerX },
    centerZ: { value: config.centerZ }
  })

  const model = useGLTF(
    `/models/${MODEL_NAME}`,
    undefined,
    undefined,
    (loader) => {
      loader.manager.onLoad = () => setLoaded()
    }
  )

  useLayoutEffect(() => {
    if (!model || !camera) return

    /* Cards hover */
    const cards = model.nodes['Cards']
    cardsRef.current = cards.children

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

    scene.fog = new THREE.Fog(
      params.fogHorizonColor,
      config.fogNear,
      config.fogFar
    )

    const mouseTracker = trackCursor((cursor) => {
      gsap.to(camera.rotation, {
        overwrite: true,
        duration: DURATION / 2.5,
        x:
          config.camXRotation +
          cursor.y * (Math.PI * config.camRotationMultiplierX) +
          Math.PI * 0.025,
        y:
          config.camYRotation +
          -cursor.x * (Math.PI * config.camRotationMultiplierY),
        ease: 'power2.out'
      })
    })

    return () => {
      mouseTracker.destroy()
    }
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

    if (scene.fog) {
      scene.fog.near = config.fogNear
      scene.fog.far = config.fogFar
    }

    const uniformKeys = Object.keys(uniforms.current)

    /* Update Uniforms */
    Object.keys(config)
      .filter((key) => uniformKeys.includes(key))
      .map((key) => {
        uniforms.current[key].value = config[key]
      })
  }, [config])

  // useFrame((st) => {
  // const intersecting = raycaster.intersectObjects(cardsRef.current)
  // intersecting[0]?.object?.scale?.set?.(2, 2, 2)
  // })

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
  <R3FCanvasLayout {...props} htmlChildren={<Loader />} />
)
KarlBg.Title = 'Karl Background'
KarlBg.Tags = '3d,private'

export default KarlBg
