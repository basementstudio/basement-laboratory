import { Stats } from '@react-three/drei'
import { useLoader, useThree } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { folder } from 'leva'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'

import { AspectCanvas } from '~/components/common/aspect-canvas'
import { HTMLLayout } from '~/components/layout/html-layout'
import { useMousetrap } from '~/hooks/use-mousetrap'
import { useReproducibleControls } from '~/hooks/use-reproducible-controls'

const SVGExtrudedModel = ({ src, config = {} }) => {
  const svg = useLoader(SVGLoader, `/images/${src}`)

  const shapes = useMemo(() => {
    return svg.paths.map((path) => {
      return path.toShapes(true)
    })
  }, [svg])

  const scale = 0.02

  return (
    <group>
      {shapes.map((shape, i) => {
        return (
          <mesh
            castShadow
            receiveShadow
            scale={scale}
            position={[0, 0, 0]}
            key={i}
          >
            <extrudeGeometry
              args={[
                shape[0],
                { depth: 5, bevelEnabled: false, ...config.geometry }
              ]}
            />
            <meshStandardMaterial args={[config.material]} />
          </mesh>
        )
      })}
    </group>
  )
}

// const SVGModel = ({ src }) => {
//   const svg = useLoader(SVGLoader, `/images/${src}`)

//   const scale = 0.02

//   const shapes = useMemo(() => {
//     return svg.paths.map((path) => {
//       return path.toShapes(true)
//     })
//   }, [svg])

//   return (
//     <group>
//       {shapes.map((shape, i) => {
//         return (
//           <mesh scale={scale} position={[0, 0, 0]} key={i}>
//             <shapeGeometry args={[shape]} />
//             <meshNormalMaterial side={THREE.DoubleSide} />
//           </mesh>
//         )
//       })}
//     </group>
//   )
// }

const gliphSvgs = [
  ['n-adhesion.svg', 'm.svg', 'question-mark.svg', 'T.svg', '1.svg'],
  ['n.svg', 'T.svg', 'T.svg', 'm.svg', 'question-mark.svg'],
  ['n-adhesion.svg', 'm.svg', 'question-mark.svg', 'T.svg'],
  ['l.svg', 'l.svg', '1.svg', 'l.svg', 'T.svg'],
  ['n-adhesion.svg', 'm.svg', 'question-mark.svg', 'T.svg', '1.svg'],
  ['l.svg', '1.svg', 'T.svg', 'm.svg', 'question-mark.svg'],
  ['l.svg', 'l.svg', '1.svg', 'l.svg', 'T.svg'],
  ['n-adhesion.svg', 'm.svg', 'question-mark.svg', 'T.svg'],
  ['l.svg', 'n.svg', '1.svg', 'n.svg', 'T.svg'],
  ['n.svg', '1.svg', 'T.svg', 'm.svg', 'question-mark.svg']
]

const largestRow = gliphSvgs.reduce((acc, row) => {
  return row.length > acc ? row.length : acc
}, 0)

const FLOOR_SIZE = 10 * largestRow

const FallingSVGsRow = ({ srcs, height = 2 }) => {
  const controls = useReproducibleControls({
    Material: folder({
      color: {
        value: '#ff6000'
      }
    })
  })

  return srcs.map((src, i) => {
    const letterContainer = 6
    const xPos = i * letterContainer
    const xDisplace = (largestRow * letterContainer) / 2

    return (
      <RigidBody
        // colliders="trimesh"
        friction={0.4}
        enabledRotations={[false, false, true]}
        enabledTranslations={[true, true, false]}
        type="dynamic"
        rotation={[-Math.PI, 0, 0]}
        position={[xPos - xDisplace, height, 0]}
        key={src}
      >
        <SVGExtrudedModel
          src={src}
          config={{
            geometry: { depth: 100 },
            material: {
              color: controls.color
            }
          }}
        />
      </RigidBody>
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
      >
        <mesh>
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
      >
        <mesh>
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
      >
        <mesh>
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
      focusDistance: {
        value: 0,
        min: 0,
        max: 1,
        step: 0.01
      },
      focalLength: {
        value: 0.1,
        min: 0,
        max: 1,
        step: 0.01
      },
      bokehScale: {
        value: 2,
        min: 0,
        max: 10
      }
    })
  })
  const pointLightRef = useRef()
  const state = useThree((state) => ({
    viewport: state.viewport,
    camera: state.camera
  }))

  const TIGHTEN_WALLS_BY = 7
  const midFloor = (FLOOR_SIZE - TIGHTEN_WALLS_BY * 2) / 2
  const arcAspect = state.viewport.height / state.viewport.width
  const targetY = midFloor * arcAspect

  // useHelper(pointLightRef, THREE.PointLightHelper)

  useLayoutEffect(() => {
    state.camera.position.set(-9.488126713044938, 1.2, 4.846289517333027)

    state.camera.rotation.set(
      0.5779031050017579,
      -0.3159115182293035,
      0.19991339367841848
    )
  }, [state.camera, arcAspect, midFloor, targetY])

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

  return (
    <>
      <Stats />

      <color attach="background" args={['#000']} />
      <ambientLight intensity={controls.ambientIntensity} />

      {/* <spotLightHelper > */}
      {/* <spotLight /> */}
      {/* </spotLightHelper> */}

      {/* <TransformControls
        position={[1.6628776902174405, 10.116898784310333, 7.405612556979726]}
      > */}
      <pointLight
        position={[1.6628776902174405, 10.116898784310333, 7.405612556979726]}
        castShadow
        intensity={controls.pointIntensity}
        ref={pointLightRef}
      />
      {/* </TransformControls> */}

      {/* <OrbitControls target={[0, targetY, 0]} ref={orbitControlsRef} /> */}

      <Physics timeStep="vary" colliders="hull" gravity={[0, -50, 0]}>
        <Constraints tightenWallsBy={TIGHTEN_WALLS_BY} />

        {gliphSvgs.map((srcs, i) => (
          <FallingSVGsRow srcs={srcs} height={(i + 1) * 10} key={i} />
        ))}
      </Physics>

      {/* <EffectComposer multisampling={0}>
        
      </EffectComposer> */}
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
          position: [0, 7.5, 0],
          near: 0.001
        },
        shadows: true
      }}
    >
      {children}
    </AspectCanvas>
  </HTMLLayout>
)

export default SVGRain
