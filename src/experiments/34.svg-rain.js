import {
  OrbitControls,
  PerspectiveCamera,
  shaderMaterial,
  Stats,
  Text,
  useGLTF
} from '@react-three/drei'
import { extend, useThree } from '@react-three/fiber'
import { EffectComposer, Vignette } from '@react-three/postprocessing'
import { Physics, RigidBody } from '@react-three/rapier'
import { button, folder } from 'leva'
import { DURATION, gsap } from 'lib/gsap'
import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

import { AspectCanvas } from '~/components/common/aspect-canvas'
import { HTMLLayout } from '~/components/layout/html-layout'
import { useMousetrap } from '~/hooks/use-mousetrap'
import { useReproducibleControls } from '~/hooks/use-reproducible-controls'
import { useToggleState } from '~/hooks/use-toggle-state'
import { trackCursor } from '~/lib/three'

const MeshRefractionMaterialImpl = shaderMaterial(
  {
    uRefractPower: 0.3,
    uSceneTex: null,
    uTransparent: 0.5,
    uNoise: 0.03,
    uHue: 0.0,
    uSat: 0.0,
    winResolution: new THREE.Vector2()
  },
  `varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vWorldPos;
  
  void main() {
    vec3 pos = position;
    vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
    vec4 mvPosition = viewMatrix * worldPos;
    gl_Position = projectionMatrix * mvPosition;
    vec3 transformedNormal = normalMatrix * normal;
    vec3 normal = normalize( transformedNormal );
    vUv = uv;
    vNormal = normal;
    vViewPos = -mvPosition.xyz;
    vWorldPos = worldPos.xyz;
  }`,
  `uniform float uTransparent;
  uniform vec2 winResolution;
  uniform float uRefractPower;
  uniform float uNoise;
  uniform float uHue;
  uniform float uSat;
  
  // uniform samplerCube uEnvMap;
  uniform sampler2D uSceneTex;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vWorldPos;
  
  float random(vec2 p){
    return fract(sin(dot(p.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  vec3 sat(vec3 rgb, float adjustment)
{
    // Algorithm from Chapter 16 of OpenGL Shading Language
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}

  vec3 hue( vec3 color, float hueAdjust ){

    const vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);
    const vec3  kRGBToI      = vec3 (0.596, -0.275, -0.321);
    const vec3  kRGBToQ      = vec3 (0.212, -0.523, 0.311);

    const vec3  kYIQToR     = vec3 (1.0, 0.956, 0.621);
    const vec3  kYIQToG     = vec3 (1.0, -0.272, -0.647);
    const vec3  kYIQToB     = vec3 (1.0, -1.107, 1.704);

    float   YPrime  = dot (color, kRGBToYPrime);
    float   I       = dot (color, kRGBToI);
    float   Q       = dot (color, kRGBToQ);
    float   hue     = atan (Q, I);
    float   chroma  = sqrt (I * I + Q * Q);

    hue += hueAdjust;

    Q = chroma * sin (hue);
    I = chroma * cos (hue);

    vec3    yIQ   = vec3 (YPrime, I, Q);

    return vec3( dot (yIQ, kYIQToR), dot (yIQ, kYIQToG), dot (yIQ, kYIQToB) );

}
  
  struct Geometry {
    vec3 pos;
    vec3 posWorld;
    vec3 viewDir;
    vec3 viewDirWorld;
    vec3 normal;
    vec3 normalWorld;
  };

  void main() {
    vec2 uv = gl_FragCoord.xy / winResolution.xy;
    vec2 refractNormal = vNormal.xy * (1.0 - vNormal.z * 0.85);
    vec3 refractCol = vec3( 0.0 );

    float slide;
    vec2 refractUvR;
    vec2 refractUvG;
    vec2 refractUvB;
    #pragma unroll_loop_start
    for ( int i = 0; i < 8; i ++ ) {
      slide = float(UNROLLED_LOOP_INDEX) / float(8) * 0.1 + random(uv) * uNoise;
      refractUvR = uv - refractNormal * ( uRefractPower + slide * 1.0 ) * uTransparent;
      refractUvG = uv - refractNormal * ( uRefractPower + slide * 2.0 ) * uTransparent;
      refractUvB = uv - refractNormal * ( uRefractPower + slide * 3.0 ) * uTransparent;
      refractCol.r += texture2D( uSceneTex, refractUvR ).r;
      refractCol.g += texture2D( uSceneTex, refractUvG ).g;
      refractCol.b += texture2D( uSceneTex, refractUvB ).b;
      refractCol = sat(refractCol, uSat);
    }
    #pragma unroll_loop_end

    refractCol /= float( 8 );
    gl_FragColor = vec4(hue(refractCol, uHue), 1.0);
    //#include <tonemapping_fragment>
    //#include <encodings_fragment>
  }`
)

export function MeshRefractionMaterial(props) {
  extend({ MeshRefractionMaterial: MeshRefractionMaterialImpl })
  const size = useThree((state) => state.size)
  const dpr = useThree((state) => state.viewport.dpr)
  return (
    <meshRefractionMaterial
      winResolution={[size.width * dpr, size.height * dpr]}
      {...props}
    />
  )
}

const gliphSvgs = [
  ['R00', '?', 'S', '4', 'F01', 'R01', 'N01', '4'],
  ['B01', '4', 'S', '#', 'M', 'u01', 'N01', 'Q'],
  ['B01', 'A', 'H', 'R01', 'M', 'E', 'H', 'T'],
  ['B01', 'Q', 'S', 'M', '#', 'E', 'N01', 'T'],
  ['U00', 'A', 'S', 'U00', 'Y', 'E', 'R01', '?'],
  ['F00', 'A', 'u01', 'E', 'F01', 'E', 'N01', 'T'],
  ['K', 'G', '#', 'E', 'M', 'E', 'N01', 'T'],
  ['B01', 'A', 'S', 'Q', 'M', 'Y', 'N01', 'T'],
  ['B01', 'A', 'S', 'E', 'M', 'E', 'N00', 'T']
].reverse()

const largestRow = gliphSvgs.reduce((acc, row) => {
  return row.length > acc ? row.length : acc
}, 0)

const FLOOR_SIZE = 2.5 * largestRow

const threshold = 800

const PhysicBody = ({
  materialConfig,
  focus,
  height,
  xPos,
  xDisplace,
  name
}) => {
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
      type="dynamic"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[xPos - xDisplace, height, 0]}
      scale={scale}
      key={name}
    >
      <mesh onPointerMove={focus} geometry={nodes[name].geometry}>
        <MeshRefractionMaterial {...materialConfig} />
      </mesh>
    </RigidBody>
  )
}

const FallingSVGsRow = ({ materialConfig, focus, names, height = 2 }) => {
  return names.map((name, i) => {
    const letterContainer = 1.85
    const xPos = i * letterContainer
    const xDisplace = (largestRow * letterContainer) / 2

    return (
      <PhysicBody
        materialConfig={materialConfig}
        focus={focus}
        height={height}
        xPos={xPos}
        xDisplace={xDisplace}
        name={name}
        key={i}
      />
    )
  })
}

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

const config = {
  cam: {
    position: new THREE.Vector3(
      -11.096288834783838,
      3.2768999336644313,
      6.823361968481603
    ),
    rotation: new THREE.Euler(0, -0.83895665434904, 0, 'YXZ'),
    fov: 20
  }
}

const SVGRain = () => {
  // const focusTargetRef = useRef()
  const pointLightRef = useRef()
  const orbitControlsRef = useRef()
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
      uRefractPower: { value: 0.1, min: 0, max: 1 },
      uTransparent: { value: 0.5, min: 0, max: 1 },
      uNoise: { value: 0.03, min: 0, max: 1, step: 0.01 },
      uHue: { value: 0.0, min: 0, max: Math.PI * 2, step: 0.01 },
      uSat: { value: 1.0, min: 1, max: 1.25, step: 0.01 }
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
        x: config.cam.rotation.x + cursor.y * (Math.PI * 0.01),
        y: config.cam.rotation.y + -cursor.x * (Math.PI * 0.01),
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

  // const handleFocus = useCallback((e) => {
  //   const dist = focusTargetRef.current.calculateFocusDistance(e.point)
  //   const cocMaterial = focusTargetRef.current.circleOfConfusionMaterial

  //   gsap.to(cocMaterial.uniforms.focusDistance, {
  //     overwrite: true,
  //     value: dist,
  //     duration: 0.5,
  //     delay: 0,
  //     ease: 'power2.out'
  //   })
  // }, [])

  return (
    <>
      {/* <axesHelper />
      <gridHelper args={[100, 100]} /> */}
      <Stats />

      <color attach="background" args={['#000']} />
      <ambientLight intensity={controls.ambientIntensity} />

      {/* <TransformControls
        position={[1.6628776902174405, 10.116898784310333, 7.405612556979726]}
      > */}
      <pointLight
        position={[1.6628776902174405, 10.116898784310333, 7.405612556979726]}
        intensity={controls.pointIntensity}
        ref={pointLightRef}
      />
      {/* </TransformControls> */}

      {/* <OrbitControls target={[0, targetY, 0]} ref={orbitControlsRef} /> */}

      <Text
        font="/Ki-Medium.ttf"
        letterSpacing={-0.075}
        lineHeight={0.8}
        position={[0, 8, -4]}
        fontSize={5}
        color={'white'}
      >
        {`THE\nSEVENTY-TWO\nNAMES OF GOD.`}
      </Text>

      <OrbitControls ref={orbitControlsRef} />

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
        <PerspectiveCamera
          makeDefault
          position={config.cam.position}
          rotation={config.cam.rotation}
          fov={config.cam.fov}
          resolution={1024}
        >
          {(texture) => (
            <>
              {gliphSvgs.map((names, i) => (
                <FallingSVGsRow
                  materialConfig={{
                    uSceneTex: texture,
                    uRefractPower: controls.uRefractPower,
                    uTransparent: controls.uTransparent,
                    uNoise: controls.uNoise,
                    uHue: controls.uHue,
                    uSat: controls.uSat
                  }}
                  color="red"
                  names={names}
                  height={(i + 1) * 3}
                  key={i}
                />
              ))}
            </>
          )}
        </PerspectiveCamera>
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
    <AspectCanvas aspect={21 / 9}>{children}</AspectCanvas>
  </HTMLLayout>
)

export default SVGRain
