import { Stats } from '@react-three/drei'
import { useLoader, useThree } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'

import { AspectCanvas } from '~/components/common/aspect-canvas'
import { HTMLLayout } from '~/components/layout/html-layout'

const SVGExtrudedModel = ({ src, ...config }) => {
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
          <mesh scale={scale} position={[0, 0, 0]} key={i}>
            <extrudeGeometry
              args={[shape[0], { depth: 5, bevelEnabled: false, ...config }]}
            />
            <meshBasicMaterial side={THREE.DoubleSide} />
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
  ['n.svg', '1.svg', 'T.svg', 'm.svg', 'question-mark.svg'],
  ['n-adhesion.svg', 'm.svg', 'question-mark.svg', 'T.svg'],
  ['l.svg', 'q-stroke.svg', '1.svg', 'n.svg', 'T.svg'],
  ['n-adhesion.svg', 'm.svg', 'question-mark.svg', 'T.svg', '1.svg'],
  ['n.svg', '1.svg', 'T.svg', 'm.svg', 'question-mark.svg'],
  ['l.svg', 'q-stroke.svg', '1.svg', 'n.svg', 'T.svg'],
  ['n-adhesion.svg', 'm.svg', 'question-mark.svg', 'T.svg'],
  ['l.svg', 'q-stroke.svg', '1.svg', 'n.svg', 'T.svg'],
  ['n.svg', '1.svg', 'T.svg', 'm.svg', 'question-mark.svg']
]

const largestRow = gliphSvgs.reduce((acc, row) => {
  return row.length > acc ? row.length : acc
}, 0)

const FLOOR_SIZE = 10 * largestRow

const config = {
  camera: {
    position: [0, 7.5, 0],
    near: 0.001
    // zoom: 48
  },
  orthographic: true
}

const FallingSVGsRow = ({ srcs, height = 2 }) => {
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
        <SVGExtrudedModel src={src} depth={100} />
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
  const state = useThree((state) => ({
    viewport: state.viewport,
    camera: state.camera
  }))

  const TIGHTEN_WALLS_BY = 7
  const midFloor = (FLOOR_SIZE - TIGHTEN_WALLS_BY * 2) / 2
  const arcAspect = state.viewport.height / state.viewport.width
  const targetY = midFloor * arcAspect

  useLayoutEffect(() => {
    state.camera.position.y = targetY
    state.camera.position.z = 5
    state.camera.lookAt(0, targetY, 0)

    state.camera.top = midFloor * arcAspect
    state.camera.bottom = -midFloor * arcAspect
    state.camera.left = -midFloor
    state.camera.right = midFloor

    state.camera.updateProjectionMatrix()
  }, [state.camera, arcAspect, midFloor, targetY])

  return (
    <>
      <Stats />

      <color attach="background" args={['#000']} />

      {/* <OrbitControls enableRotate={false} target={[0, targetY, 0]} /> */}

      <Physics timeStep="vary" colliders="hull" gravity={[0, -50, 0]}>
        {/* <Debug /> */}
        <Constraints tightenWallsBy={TIGHTEN_WALLS_BY} />

        {gliphSvgs.map((srcs, i) => (
          <FallingSVGsRow srcs={srcs} height={(i + 1) * 10} key={i} />
        ))}
      </Physics>
    </>
  )
}

SVGRain.Title = 'SVG Rain'
SVGRain.Tags = 'animation, private'
SVGRain.Layout = ({ children, ...props }) => (
  <HTMLLayout {...props}>
    <AspectCanvas aspect={21 / 9} config={config}>
      {children}
    </AspectCanvas>
  </HTMLLayout>
)

export default SVGRain
