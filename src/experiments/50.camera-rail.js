import { tunnel } from '@basementstudio/definitive-scroll'
import { OrbitControls, PerspectiveCamera, Sphere } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import { Formated } from '~/components/common/formated'
import { useMousetrap } from '~/hooks/use-mousetrap'
import { useToggleState } from '~/hooks/use-toggle-state'

import curveComplex from '../../public/splines/curve-complex.json'

const navUITunnel = tunnel()

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

/* Set an up to rotate the view pi radians on the x axis */
const initialCamPosition = new THREE.Vector3(-2, 5, 8)

const magnetTarget = new THREE.Vector3(4, 3, 2)
const magnetThreshold = 0.03

const faceTangentRotationQuaternion = new THREE.Quaternion()
const faceMagnetRotationQuaternion = new THREE.Quaternion()
const resultantRotationQuaternion = new THREE.Quaternion()
const lookAtMatrix = new THREE.Matrix4()

/* The total amount of divisions for the curve */
const curveDivisionsPerUnit = 10

const getTheClosestPointInCurvePath = (curvePath, point) => {
  const divisions = curvePath.getLength() * curveDivisionsPerUnit
  const points = curvePath.getSpacedPoints(divisions)
  let closestPoint = points[0]
  let closestDistance = closestPoint.distanceTo(point)
  let closestT = 0

  for (let i = 1; i < points.length; i += 1) {
    const distance = points[i].distanceTo(point)

    if (distance < closestDistance) {
      closestDistance = distance
      closestPoint = points[i]
      closestT = i / divisions
    }
  }

  return { point: closestPoint, t: closestT }
}

const BezierTests = () => {
  const { handleToggle: toggleCamAttached, isOn: isCamAttached } =
    useToggleState()
  const { handleToggle: toggleCameraLocked, isOn: cameraLocked } =
    useToggleState()
  const [cameraPositions, setCameraPositions] = useState(() =>
    getBezierCurves(curveComplex, 2)
  )
  const arrowRef = useRef()
  const camRef = useRef()
  const magnetLineRef = useRef()
  const tangentLineRef = useRef()
  const closestPointRef = useRef()
  const progress = useRef(0)
  const targetProgress = useRef(0)

  const pointsPath = useMemo(() => {
    const pointsPath = new THREE.CurvePath()
    cameraPositions.forEach((p) => pointsPath.add(p))

    return pointsPath
  }, [cameraPositions])

  const cameraPositionsAttrArray = useMemo(() => {
    return new Float32Array(
      pointsPath
        .getSpacedPoints(pointsPath.getLength() * curveDivisionsPerUnit)
        .flatMap((p) => [p.x, p.y, p.z])
    )
  }, [pointsPath])

  const magnetClosestPoint = useMemo(
    () => getTheClosestPointInCurvePath(pointsPath, magnetTarget),
    [pointsPath]
  )

  useFrame(() => {
    progress.current = THREE.MathUtils.lerp(
      progress.current,
      targetProgress.current,
      0.1
    )
    const remapedProgress = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(
        progress.current,
        magnetClosestPoint.t - magnetThreshold,
        magnetClosestPoint.t + magnetThreshold,
        0,
        1
      ),
      0,
      1
    )

    /* Calc faceTangentRotationQuaternion */
    const point = pointsPath.getPointAt(progress.current)
    const tangent = pointsPath.getTangent(progress.current)

    if (isCamAttached) {
      lookAtMatrix.lookAt(point, point.clone().add(tangent), camRef.current.up)
    } else {
      lookAtMatrix.lookAt(
        point.clone().add(tangent),
        point,
        arrowRef.current.up
      )
    }
    faceTangentRotationQuaternion.setFromRotationMatrix(lookAtMatrix)

    /* Calc faceMagnetRotationQuaternion */
    if (isCamAttached) {
      lookAtMatrix.lookAt(point, magnetTarget, camRef.current.up)
    } else {
      lookAtMatrix.lookAt(magnetTarget, point, arrowRef.current.up)
    }
    faceMagnetRotationQuaternion.setFromRotationMatrix(lookAtMatrix)

    /* Calc resultantRotationQuaternion */
    resultantRotationQuaternion.slerpQuaternions(
      faceTangentRotationQuaternion,
      faceMagnetRotationQuaternion,
      /* Don't know what it does? Check https://www.desmos.com/calculator/liwtwpl4gq */
      Math.sin(remapedProgress * 2 * Math.PI - Math.PI / 2) * 0.5 + 0.5
    )

    /* Update position */
    arrowRef.current.position.copy(point)

    /* Update tangent line */
    tangentLineRef.current.geometry.setFromPoints([
      point,
      point.clone().add(tangent)
    ])

    /* Update arrow rotation */
    if (cameraLocked) {
      arrowRef.current.lookAt(0, 0, 0)
    } else {
      arrowRef.current.quaternion.copy(resultantRotationQuaternion)
    }

    /* Update camera position / rotation if needed */
    if (isCamAttached) {
      camRef.current.position.copy(point)

      if (cameraLocked) {
        camRef.current.lookAt(0, 0, 0)
      } else {
        camRef.current.quaternion.copy(resultantRotationQuaternion)
      }
    }

    if (
      progress.current >= magnetClosestPoint.t - magnetThreshold &&
      progress.current <= magnetClosestPoint.t + magnetThreshold
    ) {
      magnetLineRef.current.geometry.setFromPoints([magnetTarget, point])
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

    closestPointRef.current.position.copy(magnetClosestPoint.point)
    magnetLineRef.current.geometry.setFromPoints([
      magnetTarget,
      magnetClosestPoint.point
    ])
  }, [isCamAttached, pointsPath, magnetClosestPoint])

  useEffect(() => {
    /* Set progress from 0 to 1 based on wheel events */
    const pxDuration = 16000
    const handleWheel = (e) => {
      targetProgress.current = THREE.MathUtils.clamp(
        targetProgress.current + e.deltaY / pxDuration,
        0,
        1
      )
    }

    window.addEventListener('wheel', handleWheel)

    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={initialCamPosition}
        ref={camRef}
      />
      <OrbitControls enabled={!isCamAttached} enableZoom={false} />
      <axesHelper />
      <gridHelper args={[20, 20]} />

      <group scale={0.15} visible={!isCamAttached} ref={arrowRef}>
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

      <line name="debug-tangent" ref={tangentLineRef}>
        <lineBasicMaterial attach="material" color="yellow" />
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([]), 3]}
          />
        </bufferGeometry>
      </line>

      <line name="debug-magnet-line" ref={magnetLineRef}>
        <lineBasicMaterial attach="material" color="green" />
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([]), 3]}
          />
        </bufferGeometry>
      </line>

      <Sphere scale={0.1} position={magnetTarget}>
        <meshBasicMaterial color="red" />
      </Sphere>

      <Sphere scale={0.1} ref={closestPointRef}>
        <meshBasicMaterial transparent opacity={0.5} color="blue" />
      </Sphere>

      {pointsPath
        .getSpacedPoints(pointsPath.getLength() * curveDivisionsPerUnit)
        .map((p, i) => {
          return (
            <Sphere
              key={i}
              scale={0.02}
              position={p}
              visible={!isCamAttached}
              name={`debug-point-${i}`}
            >
              <meshBasicMaterial color="white" />
            </Sphere>
          )
        })}

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

BezierTests.Title = 'Camera Rail'
BezierTests.Description = (
  <Formated>
    <p>
      This example is based on{' '}
      <a href="/examples/49.bezier-import" target="_blank">
        this other example
      </a>{' '}
      to show how splines can be used to create a camera rail. The camera will
      follow the curve and rotate to face the tangent's direction of the current
      point in the curve. It also modifies the target view in certain points of
      the curve to face other desired targets.
    </p>
    <h3>Controls</h3>
    <ul>
      <li>
        <code>A</code> - Toggle camera attached to the bezier curve
      </li>
      <li>
        <code>L</code> - Toggle between camera rotation locked to the bezier
        curve or (0, 0, 0)
      </li>
    </ul>
    <navUITunnel.Out />
  </Formated>
)
BezierTests.Tags = 'private'

export default BezierTests
