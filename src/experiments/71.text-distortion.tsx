import {
  MeshTransmissionMaterial,
  OrbitControls,
  Text
} from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef } from 'react'

const RADIUS = 2.3
const fontUrl =
  '/fonts/grotesque/BasementGrotesqueDisplay-UltraBlackExtraExpanded.woff'

const TextDistortion = () => {
  const { text, backsideThickness, thickness } = useControls({
    text: {
      value: 'basement.    basement.    basement.    ',
      label: 'Text'
    },
    backsideThickness: { value: 5, min: 0, max: 10 },
    thickness: { value: 2.3, min: 0, max: 10 }
  })
  const ref = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!ref.current) return
    ref.current.rotation.y += 0.01
    ref.current.rotation.x += 0.01
    ref.current.rotation.z += 0.01
  })

  // Calculate positions for text
  const textPositions: { x: number; z: number }[] = []
  const angleStep = (2 * Math.PI) / text.length
  for (let i = 0; i < text.length; i++) {
    const angle = i * angleStep
    const x = RADIUS * Math.cos(angle)
    const z = RADIUS * Math.sin(angle)
    textPositions.push({ x, z })
  }

  return (
    <>
      <ambientLight />

      <OrbitControls />

      <group ref={ref}>
        <mesh rotation={[0, 0, 0]}>
          <capsuleGeometry args={[RADIUS, 1, 4, 50]} />
          <MeshTransmissionMaterial
            backside
            backsideThickness={backsideThickness}
            thickness={thickness}
            distortionScale={0}
            temporalDistortion={0}
          />
        </mesh>
        {text
          .split('')
          .reverse()
          .map((char: string, index: number) => (
            <Text
              key={index}
              font={fontUrl}
              scale={[1, 1, 1]}
              position={[textPositions[index].x, 0, textPositions[index].z]}
              rotation={[0, -angleStep * index + Math.PI / 2, 0]}
              fontSize={0.3}
              lineHeight={1}
              color="white"
              textAlign="center"
            >
              {char}
            </Text>
          ))}
      </group>
    </>
  )
}

TextDistortion.Title = 'Text Distortion'

export default TextDistortion
