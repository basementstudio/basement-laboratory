import { Instance, Instances } from '@react-three/drei'

export const CoolGrid = ({ number = 23, lineWidth = 0.026, height = 0.5 }) => (
  // Renders a grid and crosses as instances
  <Instances position={[0, 0, 0]}>
    <planeGeometry args={[lineWidth, height]} />
    <meshBasicMaterial color="#999" />
    {Array.from({ length: number }, (_, y) =>
      Array.from({ length: number }, (_, x) => (
        <group
          key={x + ':' + y}
          position={[
            x * 2 - Math.floor(number / 2) * 2,
            0,
            y * 2 - Math.floor(number / 2) * 2
          ]}
        >
          <Instance rotation={[-Math.PI / 2, 0, 0]} />
          <Instance rotation={[-Math.PI / 2, 0, Math.PI / 2]} />
        </group>
      ))
    )}
    <gridHelper
      args={[number * 2, number * 2, '#bbb', '#bbb']}
      position={[0, 0, 0]}
    />
  </Instances>
)
