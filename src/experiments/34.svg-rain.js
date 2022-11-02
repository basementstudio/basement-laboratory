import { OrbitControls, Stats } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { useMemo } from 'react'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'

import { AspectCanvas } from '~/components/common/aspect-canvas'
import { CoolGrid } from '~/components/common/cool-grid'
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
            <meshNormalMaterial side={THREE.DoubleSide} />
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
  '2.svg',
  'l.svg',
  'q-stroke.svg',
  'n-adhesion.svg',
  'm.svg',
  'question-mark.svg',
  '1.svg',
  'n.svg'
]

const FLOOR_SIZE = 10 * gliphSvgs.length

const SVGRain = () => {
  return (
    <>
      <Stats />
      <fog attach="fog" near={20} far={40} color="#f2f2f5" />
      <axesHelper />
      <color attach="background" args={['#f2f2f5']} />
      <ambientLight intensity={0.8} />

      <OrbitControls />

      <CoolGrid />

      <Physics timeStep="vary" colliders="hull" gravity={[0, -9.8, 0]}>
        {/* <Debug /> */}
        {gliphSvgs.map((src, i) => {
          const letterContainer = 5
          const xPos = i * letterContainer
          const xDisplace = (gliphSvgs.length * 4.5) / 2

          return (
            <RigidBody
              // colliders="trimesh"
              rotation={[-Math.PI, 0, 0]}
              position={[xPos - xDisplace, 8, 0]}
              key={src}
            >
              <SVGExtrudedModel src={src} depth={20} />
            </RigidBody>
          )
        })}

        <RigidBody
          colliders="cuboid"
          enabledRotations={[false, false, false]}
          enabledTranslations={[false, false, false]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.5, 0]}
        >
          <mesh>
            <boxBufferGeometry args={[FLOOR_SIZE, FLOOR_SIZE, 1]} />
            <meshBasicMaterial color="red" opacity={0} transparent />
          </mesh>
        </RigidBody>
      </Physics>
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
          position: [0, 4, 15],
          near: 0.001
          // fov: 40
          // zoom: 45
        }
        // orthographic: true
      }}
    >
      {children}
    </AspectCanvas>
  </HTMLLayout>
)

export default SVGRain
