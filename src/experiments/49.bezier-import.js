import { tunnel } from '@basementstudio/definitive-scroll'
import { Box, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import { Formated } from '~/components/common/formated'
import { useMousetrap } from '~/hooks/use-mousetrap'
import { useToggleState } from '~/hooks/use-toggle-state'

import curveComplex from '../../public/splines/curve-complex.json'

const navUITunnel = tunnel()

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

const BezierTests = () => {
  const { handleToggle: toggleCamAttached, isOn: isCamAttached } =
    useToggleState()
  const boxRef = useRef()
  const [cameraPositions, setCameraPositions] = useState(() =>
    getBezierCurves(curveComplex, 2)
  )

  const pointsPath = useMemo(() => {
    const pointsPath = new THREE.CurvePath()
    cameraPositions.forEach((p) => pointsPath.add(p))

    return pointsPath
  }, [cameraPositions])

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

      <navUITunnel.In>
        <h3>Import your own bezier 👀</h3>
        <div
          style={{
            marginTop: 8,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '14px',
            position: 'relative'
          }}
        >
          <input
            type="file"
            style={{ position: 'absolute', inset: 0, opacity: '0' }}
            onChange={(e) => {
              const file = e.target.files[0]
              const reader = new FileReader()

              reader.onload = (e) => {
                const json = JSON.parse(e.target.result)

                setCameraPositions(getBezierCurves(json, 1))
              }

              reader.readAsText(file)
            }}
          />
          <p style={{ fontSize: 14, textAlign: 'center' }}>
            Drop your own JSON here
          </p>
        </div>
      </navUITunnel.In>
    </>
  )
}

BezierTests.Title = 'Imported Bezier Curves'
BezierTests.Description = (
  <Formated>
    <p>
      This experiment aims to make using bezier curves much easier giving you
      the hability to export them from Blender (not supported by{' '}
      <code>gltf</code>).
    </p>
    <p>
      We acomplish this by exporting a <code>JSON</code> file with points
      information, then client code interprets that <code>JSON</code> and
      creates all the ThreeJS necesary instances.
    </p>
    <p>
      You can download the exporter plug-in we made for Blender{' '}
      <a
        href="https://github.com/basementstudio/blender-bezier-exporter"
        target="_blank"
        rel="noopener"
      >
        here
      </a>
      .
    </p>
    <navUITunnel.Out />
  </Formated>
)
BezierTests.Tags = 'private'

export default BezierTests
