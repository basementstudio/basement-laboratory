import {
  shaderMaterial,
  Stats,
  TransformControls,
  useGLTF
} from '@react-three/drei'
import { extend, useThree } from '@react-three/fiber'
import { EffectComposer, Vignette } from '@react-three/postprocessing'
import { Physics, RigidBody } from '@react-three/rapier'
import glsl from 'glslify'
import { button, folder } from 'leva'
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef
} from 'react'
import * as THREE from 'three'

import { AspectCanvas } from '~/components/common/aspect-canvas'
import { HTMLLayout } from '~/components/layout/html-layout'
import { useMousetrap } from '~/hooks/use-mousetrap'
import { useReproducibleControls } from '~/hooks/use-reproducible-controls'
import { useToggleState } from '~/hooks/use-toggle-state'
import { DURATION, gsap } from '~/lib/gsap'
import { trackCursor } from '~/lib/three'

const config = {
  cam: {
    position: new THREE.Vector3(
      -11.096288834783838,
      3.2768999336644313,
      6.823361968481603
    ),
    rotation: new THREE.Euler(0, -0.83895665434904, 0, 'YXZ'),
    fov: 20
  },
  light: {
    position: new THREE.Vector3(
      -7.984629070935935,
      4.2702468181164335,
      5.463079488712904
    )
  }
}

const MeshRefractionMaterialImpl = shaderMaterial(
  {
    resolution: [900, 900],
    time: 0,
    color: new THREE.Color(1, 0, 0),
    lightPosition: config.light.position.clone(),
    ditherSize: 216
  },
  `
    uniform vec3 lightPosition;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vLightVec;

    void main() {
      vec3 pos = position;
      vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
      vec4 mvPosition = viewMatrix * worldPos;

      gl_Position = projectionMatrix * mvPosition;

      vNormal = normalMatrix * normal;
      vPosition = worldPos.xyz;

      vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
      vec4 viewLightPos = viewMatrix * vec4(lightPosition, 1.0);

      vLightVec = viewLightPos.xyz - viewPos.xyz;
    }
  `,
  glsl`
    precision highp float;
    uniform vec3 color;
    uniform float time;
    uniform vec2 resolution;
    uniform float ditherSize;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vLightVec;

    // varying vec2 screenUV;
    #pragma glslify: dither = require('glsl-dither/8x8');

    void main () {
      vec3 L = normalize(vLightVec);
      vec3 N = normalize(vNormal);

      // vec3 lightDir = normalize(N - L);
      float diffuse = max(dot(N, L), 0.0);

      float dither = dither(gl_FragCoord.xy / resolution.xy * ditherSize, diffuse);

      gl_FragColor = vec4(color * dither, 1.0);
    }
  `
)

extend({ MeshRefractionMaterial: MeshRefractionMaterialImpl })

const gliphSvgs = [
  ['R00', '?', 'S', '4', 'F01', 'R01', 'N01', '4'],
  ['B01', '4', 'S', '#', 'M', 'U01', 'N01', 'Q'],
  ['B01', 'A', 'H', 'R01', 'M', 'E', 'H', 'T'],
  ['B01', 'Q', 'S', 'M', '#', 'E', 'N01', 'T'],
  ['U00', 'A', 'S', 'U00', 'Y', 'E', 'R01', '?'],
  ['F00', 'A', 'U01', 'E', 'F01', 'E', 'N01', 'T'],
  ['K', 'G', '#', 'E', 'M', 'E', 'N01', 'T'],
  ['B01', 'A', 'S', 'Q', 'M', 'Y', 'N01', 'T'],
  ['B01', 'A', 'S', 'E', 'M', 'E', 'N00', 'T']
].reverse()

const largestRow = gliphSvgs.reduce((acc, row) => {
  return row.length > acc ? row.length : acc
}, 0)

const FLOOR_SIZE = 2.5 * largestRow

const threshold = 800

const PhysicBody = forwardRef(
  ({ focus, height, xPos, xDisplace, name, materialConfig = {} }, ref) => {
    const { nodes } = useGLTF('/models/glyphs.glb')

    const scale = 0.05

    return (
      <RigidBody
        onContactForce={(e) => {
          if (e.collider.contactForceEventThreshold() < threshold) {
            e.collider.setContactForceEventThreshold(threshold)
          }
        }}
        colliders="hull"
        enabledRotations={[false, false, true]}
        enabledTranslations={[true, true, false]}
        rotation={[0, 0, 0]}
        type="dynamic"
        position={[xPos - xDisplace, height, 0]}
        scale={scale}
        key={name}
      >
        <mesh onPointerMove={focus} geometry={nodes[name].geometry} ref={ref}>
          <meshRefractionMaterial {...materialConfig} />
          {/* <meshNormalMaterial /> */}
        </mesh>
      </RigidBody>
    )
  }
)

const Constraints = ({ tightenWallsBy }) => {
  const constraintsThinkness = 1

  return (
    <>
      {/* Floor */}
      <RigidBody
        colliders="cuboid"
        type="fixed"
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        includeInvisible
      >
        <mesh visible={false}>
          <boxBufferGeometry
            args={[FLOOR_SIZE, FLOOR_SIZE, constraintsThinkness]}
          />
          <meshBasicMaterial color="red" />
        </mesh>
      </RigidBody>

      {/* Right Wall */}
      <RigidBody
        colliders="cuboid"
        type="fixed"
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          FLOOR_SIZE / 2 - tightenWallsBy + constraintsThinkness / 2,
          FLOOR_SIZE / 2,
          0
        ]}
        includeInvisible
      >
        <mesh visible={false}>
          <boxBufferGeometry
            args={[constraintsThinkness, FLOOR_SIZE, FLOOR_SIZE]}
          />
          <meshBasicMaterial color="red" />
        </mesh>
      </RigidBody>

      {/* Left Wall */}
      <RigidBody
        colliders="cuboid"
        type="fixed"
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          -FLOOR_SIZE / 2 + tightenWallsBy - constraintsThinkness / 2,
          FLOOR_SIZE / 2,
          0
        ]}
        includeInvisible
      >
        <mesh visible={false}>
          <boxBufferGeometry
            args={[constraintsThinkness, FLOOR_SIZE, FLOOR_SIZE]}
          />
          <meshBasicMaterial color="red" />
        </mesh>
      </RigidBody>
    </>
  )
}

const SVGRain = () => {
  // const focusTargetRef = useRef()
  const pointLightRef = useRef()
  const orbitControlsRef = useRef()
  const meshRefs = useRef({})
  // const { nodes, materials } = useGLTF('/models/glyphs.glb')

  const { isOn, handleToggle } = useToggleState(false)
  const controls = useReproducibleControls({
    Lights: folder({
      ambientIntensity: {
        value: 0.3,
        min: 0,
        max: 1
      },
      pointIntensity: {
        value: 1,
        min: 0,
        max: 1
      }
    }),

    Vignette: folder({
      offset: {
        value: 0.4,
        min: 0,
        max: 1
      },
      darkness: {
        value: 0.6,
        min: 0,
        max: 1
      },
      opacity: {
        value: 1,
        min: 0,
        max: 1
      }
    }),
    Material: folder({
      diethering: {
        value: 216,
        min: 0,
        max: 1024
      }
    }),
    World: folder({
      'play/pause': button(() => {
        handleToggle()
      })
    })
  })

  const state = useThree((state) => ({
    gl: state.gl,
    scene: state.scene,
    viewport: state.viewport,
    camera: state.camera
  }))

  const TIGHTEN_WALLS_BY = 1.5
  // const midFloor = (FLOOR_SIZE - TIGHTEN_WALLS_BY * 2) / 2
  // const arcAspect = state.viewport.height / state.viewport.width
  // const targetY = midFloor * arcAspect

  // useHelper(pointLightRef, THREE.PointLightHelper)

  useLayoutEffect(() => {
    state.camera.position.copy(config.cam.position)
    state.camera.rotation.copy(config.cam.rotation)

    const mouseTracker = trackCursor((cursor) => {
      gsap.to(state.camera.rotation, {
        overwrite: true,
        duration: DURATION / 2.5,
        x: config.cam.rotation.x + cursor.y * (Math.PI * 0.005),
        y: config.cam.rotation.y + -cursor.x * (Math.PI * 0.005),
        ease: 'power2.out'
      })
    }, state.gl.domElement)

    return () => {
      mouseTracker.destroy()
    }
  }, [state.gl.domElement, state.camera])

  useMousetrap([
    {
      keys: 'o',
      callback: () => {
        console.log({ cam: state.camera, light: pointLightRef.current })
      }
    },
    {
      keys: 'l',
      callback: () => {
        console.log('Toggle orbit enabled')
        orbitControlsRef.current.enabled = !orbitControlsRef.current.enabled
      }
    }
  ])

  useEffect(() => {
    Object.values(meshRefs.current).forEach((mesh) => {
      mesh.material.uniforms.ditherSize.value = controls.diethering
    })
  }, [controls.diethering])

  const handleChange = useCallback(() => {
    // if (!e?.target) return
    // const lightPos = e.target.positionStart.clone().add(e.target.offset)
    // console.log(lightPos)
    // meshRef?.current?.material?.uniforms?.lightPosition?.value?.copy?.(lightPos)
    // Object.values(meshRefs.current).forEach((mesh) => {
    //   mesh?.material?.uniforms?.lightPosition?.value?.copy?.(lightPos)
    // })
  }, [])

  return (
    <>
      <Stats />

      <color attach="background" args={['#000']} />
      <ambientLight intensity={controls.ambientIntensity} />

      <TransformControls
        position={[
          config.light.position.x,
          config.light.position.y,
          config.light.position.z
        ]}
        onChange={handleChange}
      >
        <object3D />
      </TransformControls>

      {/* <TransformControls>
        <mesh ref={meshRef}>
          <torusGeometry args={[10, 3, 16, 100]} />
          <meshRefractionMaterial />
        </mesh>
      </TransformControls> */}

      <Physics
        paused={isOn}
        colliders={'hull'}
        timeStep="vary"
        gravity={[0, -4, 0]}
        updatePriority={-100}
        key="same"
      >
        {/* <Debug /> */}
        <Constraints tightenWallsBy={TIGHTEN_WALLS_BY} />

        {gliphSvgs.map((names, i1) => (
          <>
            {names.map((name, i2) => {
              const letterContainer = 1.85
              const xPos = i2 * letterContainer
              const xDisplace = (largestRow * letterContainer) / 2

              return (
                <PhysicBody
                  height={(i1 + 1) * 3}
                  xPos={xPos}
                  xDisplace={xDisplace}
                  name={name}
                  key={`${name}-${i1}-${i2}`}
                  ref={(ref) => {
                    meshRefs.current[`${i1}-${i2}`] = ref
                  }}
                />
              )
            })}
          </>
        ))}
      </Physics>

      <EffectComposer disableNormalPass multisampling={0}>
        <Vignette
          opacity={controls.opacity}
          darkness={controls.darkness}
          offset={controls.offset}
        />
      </EffectComposer>
    </>
  )
}

SVGRain.Title = 'Glyph Rain'
SVGRain.Tags = 'animation, private'
SVGRain.Layout = ({ children, ...props }) => (
  <HTMLLayout {...props}>
    <AspectCanvas
      aspect={21 / 9}
      config={{
        camera: {
          position: config.cam.position,
          fov: config.cam.fov,
          rotation: config.cam.rotation
        }
      }}
    >
      {children}
    </AspectCanvas>
  </HTMLLayout>
)

export default SVGRain
