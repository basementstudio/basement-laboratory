import { Box, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

import { useMousetrap } from '~/hooks/use-mousetrap'
import { useToggleState } from '~/hooks/use-toggle-state'

import curveComplex from '../../public/splines/curve-complex.json'

/* 
  This works like:
  [..points, controls..]
                        -----> CubicBezierCurve3
  [..points, controls..]
                        -----> CubicBezierCurve3
  [..points, controls..]
                        -----> CubicBezierCurve3
  [..points, controls..]
*/

const getBezierCurves = (curve, scale = 1) => {
  const beziers = []

  for (let i = 0; i < curve.length; i += 1) {
    const p1 = curve[i]
    const p2 = curve[i + 1]

    if (!p2) break

    beziers.push(
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(p1.px, p1.pz, p1.py).multiplyScalar(scale),
        new THREE.Vector3(p1.hrx, p1.hrz, p1.hry).multiplyScalar(scale),
        new THREE.Vector3(p2.hlx, p2.hlz, p2.hly).multiplyScalar(scale),
        new THREE.Vector3(p2.px, p2.pz, p2.py).multiplyScalar(scale)
      )
    )
  }

  return beziers
}

const cameraPositions = getBezierCurves(curveComplex, 2)

const BezierTests = () => {
  const { handleToggle: toggleCamAttached, isOn: isCamAttached } =
    useToggleState()
  const boxRef = useRef()

  const pointsPath = useMemo(() => {
    const pointsPath = new THREE.CurvePath()
    cameraPositions.forEach((p) => pointsPath.add(p))

    return pointsPath
  }, [])

  const cameraPositionsPointsPath = useMemo(() => {
    const points = pointsPath.curves.reduce(
      (p, d) => [...p, ...d.getPoints(40)],
      []
    )

    return points
  }, [pointsPath])

  const cameraPositionsAttrArray = useMemo(() => {
    return new Float32Array(
      cameraPositionsPointsPath.flatMap((p) => [p.x, p.y, p.z])
    )
  }, [cameraPositionsPointsPath])

  useFrame((s) => {
    if (!boxRef.current) return

    const t = Math.sin(Date.now() / 1000) * 0.5 + 0.5
    const point = pointsPath.getPointAt(t)

    boxRef.current.position.copy(point)
    boxRef.current.lookAt(0, 0, 0)

    if (isCamAttached) {
      s.camera.position.copy(point)
      s.camera.lookAt(0, 0, 0)
    }
  }, [])

  useMousetrap([
    {
      keys: 'a',
      callback: toggleCamAttached
    }
  ])

  return (
    <>
      <OrbitControls />
      <axesHelper />
      <gridHelper args={[20, 20]} />

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

BezierTests.Title = 'Imported Bezier Curves'
// BezierTests.Description = 'Bezier curves imported from a JSON file'
BezierTests.Tags = 'private'

export default BezierTests
