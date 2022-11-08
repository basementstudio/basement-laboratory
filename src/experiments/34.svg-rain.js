import { OrbitControls, Stats, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { DepthOfField, EffectComposer } from '@react-three/postprocessing'
import { Physics, RigidBody } from '@react-three/rapier'
import { button, folder } from 'leva'
import { gsap } from 'lib/gsap'
import { useCallback, useLayoutEffect, useRef } from 'react'

import { AspectCanvas } from '~/components/common/aspect-canvas'
import { HTMLLayout } from '~/components/layout/html-layout'
import { useMousetrap } from '~/hooks/use-mousetrap'
import { useReproducibleControls } from '~/hooks/use-reproducible-controls'
import { useToggleState } from '~/hooks/use-toggle-state'

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

const PhysicBody = ({ focus, height, xPos, xDisplace, name }) => {
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
        <meshStandardMaterial args={[{ color: 'red' }]} />
      </mesh>
    </RigidBody>
  )
}

const FallingSVGsRow = ({ focus, names, height = 2 }) => {
  return names.map((name, i) => {
    const letterContainer = 1.85
    const xPos = i * letterContainer
    const xDisplace = (largestRow * letterContainer) / 2

    return (
      <PhysicBody
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
          <meshBasicMaterial color="red" opacity={0} transparent />
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
          <meshBasicMaterial color="red" opacity={0} transparent />
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
          <meshBasicMaterial color="red" opacity={0} transparent />
        </mesh>
      </RigidBody>
    </>
  )
}

const SVGRain = () => {
  const focusTargetRef = useRef()
  // const { nodes, materials } = useGLTF('/models/glyphs.glb')

  const { isOn, handleToggle } = useToggleState(false)
  const orbitControlsRef = useRef()
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
    Cam: folder({
      focusZ: {
        value: 0
      },
      focusDistance: {
        value: 0.011975014191862875,
        min: 0,
        max: 0.1,
        step: 0.0001
      },
      focalLength: {
        value: 0.006699999999999998,
        min: 0,
        max: 0.1,
        step: 0.0001
      },
      bokehScale: {
        value: 10,
        min: 0,
        max: 20
      }
    }),
    World: folder({
      'play/pause': button(() => {
        handleToggle()
      })
    })
  })
  const pointLightRef = useRef()
  const state = useThree((state) => ({
    gl: state.gl,
    scene: state.scene,
    viewport: state.viewport,
    camera: state.camera
  }))

  const TIGHTEN_WALLS_BY = 1.5
  const midFloor = (FLOOR_SIZE - TIGHTEN_WALLS_BY * 2) / 2
  const arcAspect = state.viewport.height / state.viewport.width
  const targetY = midFloor * arcAspect

  // useHelper(pointLightRef, THREE.PointLightHelper)

  useLayoutEffect(() => {
    state.camera.position.set(
      -8.164388759155946,
      3.78843722719486,
      5.752519991674297
    )

    state.camera.rotation.set(
      -0.02530178380782242,
      -0.95684791194353,
      -0.020682629574103672
    )
  }, [state.camera])

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

  const handleFocus = useCallback((e) => {
    const dist = focusTargetRef.current.calculateFocusDistance(e.point)
    const cocMaterial = focusTargetRef.current.circleOfConfusionMaterial
    // cocMaterial.uniforms.focusDistance.value = dist

    gsap.to(cocMaterial.uniforms.focusDistance, {
      overwrite: true,
      value: dist,
      duration: 0.5,
      delay: 0,
      ease: 'power2.out'
    })
  }, [])

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

      <OrbitControls target={[0, targetY, 0]} ref={orbitControlsRef} />

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

        {gliphSvgs.map((names, i) => (
          <FallingSVGsRow
            focus={handleFocus}
            names={names}
            height={(i + 1) * 3}
            key={i}
          />
        ))}
      </Physics>

      <EffectComposer multisampling={0}>
        <DepthOfField
          target={null}
          focusDistance={controls.focusDistance}
          focalLength={controls.focalLength}
          bokehScale={controls.bokehScale}
          blur={controls.bokehScale}
          ref={focusTargetRef}
        />
      </EffectComposer>
    </>
  )
}

SVGRain.Title = 'SVG Rain'
SVGRain.Tags = 'animation, private'
SVGRain.Layout = ({ children, ...props }) => (
  <HTMLLayout {...props}>
    <AspectCanvas
      aspect={21 / 9}
      config={{
        camera: {
          position: [0, 90, 80],
          fov: 20
        }
      }}
    >
      {children}
    </AspectCanvas>
  </HTMLLayout>
)

export default SVGRain
