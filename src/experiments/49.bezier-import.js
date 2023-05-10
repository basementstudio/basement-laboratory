import { tunnel } from '@basementstudio/definitive-scroll'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import { BezierDropArea } from '~/components/common/bezier-drop-area'
import { Formated } from '~/components/common/formated'
import { useMousetrap } from '~/hooks/use-mousetrap'
import { useToggleState } from '~/hooks/use-toggle-state'
import { getBezierCurves } from '~/lib/three'

import curveComplex from '../../public/splines/curve-complex.json'

const navUITunnel = tunnel()

const up = new THREE.Vector3(0, 0, 1)
const axis = new THREE.Vector3()
const initialCamPosition = new THREE.Vector3(-2, 5, 8)

const BezierTests = () => {
  const { handleToggle: toggleCamAttached, isOn: isCamAttached } =
    useToggleState()
  const { handleToggle: toggleCameraLocked, isOn: cameraLocked } =
    useToggleState()
  const boxRef = useRef()
  const camRef = useRef()
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

  useFrame(() => {
    if (!boxRef.current) return

    const progress =
      Math.sin(Date.now() / 100 / pointsPath.getLength()) * 0.5 + 0.5

    const point = pointsPath.getPointAt(progress)
    const tangent = pointsPath.getTangent(progress)
    const radians = Math.acos(up.dot(tangent))

    axis.crossVectors(up, tangent).normalize()

    boxRef.current.position.copy(point)

    if (cameraLocked) {
      boxRef.current.up = up
      boxRef.current.lookAt(0, 0, 0)
    } else {
      boxRef.current.quaternion.setFromAxisAngle(axis, radians)
    }

    if (isCamAttached) {
      camRef.current.position.copy(point)

      if (cameraLocked) {
        camRef.current.lookAt(0, 0, 0)
      } else {
        camRef.current.quaternion.setFromAxisAngle(axis, radians)
      }
    }
  }, [])

  useMousetrap([
    {
      keys: 'a',
      callback: toggleCamAttached
    },
    {
      keys: 'l',
      callback: toggleCameraLocked
    }
  ])

  useEffect(() => {
    if (!isCamAttached) {
      camRef.current.position.copy(initialCamPosition)
      camRef.current.lookAt(0, 0, 0)
    }
  }, [isCamAttached])

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={initialCamPosition}
        ref={camRef}
      />
      <OrbitControls enabled={!isCamAttached} />
      <axesHelper />
      <gridHelper args={[20, 20]} />

      <group scale={0.15} visible={!isCamAttached} ref={boxRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 2.5]}>
          <coneGeometry args={[1, 2, 10]} />
          <meshNormalMaterial />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.6, 3, 10]} />
          <meshNormalMaterial />
        </mesh>
      </group>

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
        <BezierDropArea onDrop={setCameraPositions} />
      </navUITunnel.In>
    </>
  )
}

export const title = 'Imported Bezier Curves'
export const description = (
  <Formated>
    <p>
      This experiment aims to make bezier curves much easier to use, giving you
      the ability to export them from Blender (not supported by{' '}
      <code>gltf</code>).
    </p>
    <p>
      We acomplish this by exporting a <code>JSON</code> file filled with data
      for each point of the curve, that the client code then interprets and uses
      to create all the necessary ThreeJS instances.
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
export const tags = ['private']

export default BezierTests
