import { Box, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const cameraPositions = new THREE.CubicBezierCurve3(
  new THREE.Vector3(-1, 0, 1),
  new THREE.Vector3(2.0, 1.5, 0),
  new THREE.Vector3(-0.5, 1.5, 0),
  new THREE.Vector3(1, 3, 1)
)

const BezierTests = () => {
  const boxRef = useRef()

  const cameraPositionsPointsPath = useMemo(() => {
    const pointsPath = new THREE.CurvePath()
    pointsPath.add(cameraPositions)

    const points = pointsPath.curves.reduce(
      (p, d) => [...p, ...d.getPoints(50)],
      []
    )

    return points
  }, [])

  const cameraPositionsAttrArray = useMemo(() => {
    return new Float32Array(
      cameraPositionsPointsPath.flatMap((p) => [p.x, p.y, p.z])
    )
  }, [cameraPositionsPointsPath])

  useFrame(() => {
    if (!boxRef.current) return

    const t = Math.sin(Date.now() / 1000) * 0.5 + 0.5
    const point = cameraPositions.getPointAt(t)

    boxRef.current.position.copy(point)
    boxRef.current.lookAt(0, 0, 0)
  }, [])

  return (
    <>
      <OrbitControls />
      <axesHelper />
      <gridHelper args={[10, 10]} />

      <Box args={[0.5, 0.5, 0.5]} ref={boxRef}>
        <meshNormalMaterial />
      </Box>

      <line name="debug-camera-positions">
        <lineBasicMaterial attach="material" color="red" />
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            args={[cameraPositionsAttrArray, 3]}
          />
        </bufferGeometry>
      </line>
    </>
  )
}

BezierTests.Title = 'Bezier Tests'

export default BezierTests
