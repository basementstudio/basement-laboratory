import { tunnel } from '@basementstudio/definitive-scroll'
import { OrbitControls, PerspectiveCamera, Sphere } from '@react-three/drei'
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
  const progress = useRef({ value: 0, target: 0 })
  const nextTargetProgress = useRef(0)

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
    progress.current.value = THREE.MathUtils.lerp(
      progress.current.value,
      progress.current.target,
      0.1
    )
    nextTargetProgress.current = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(
        progress.current.value,
        magnetClosestPoint.t - magnetThreshold,
        magnetClosestPoint.t + magnetThreshold,
        0,
        1
      ),
      0,
      1
    )

    /* Don't know what this does? Check https://www.desmos.com/calculator/ma7ygbq9yj */
    const magnetDistCurve =
      Math.sin(nextTargetProgress.current * 2 * Math.PI - Math.PI / 2) * 0.5 +
      0.5

    /* Calc faceTangentRotationQuaternion */
    const point = pointsPath.getPointAt(progress.current.value)
    const tangent = pointsPath.getTangent(progress.current.value)

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
      magnetDistCurve
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
      progress.current.value >= magnetClosestPoint.t - magnetThreshold &&
      progress.current.value <= magnetClosestPoint.t + magnetThreshold
    ) {
      magnetLineRef.current.geometry.setFromPoints([magnetTarget, point])

      /* Apply magnet atraction */
      const atractionForce = 0.0005
      /* Don't know what this does? https://www.desmos.com/calculator/h4rvidjjcx */
      const atractionResult =
        Math.sin(nextTargetProgress.current * Math.PI + Math.PI / 2) *
        atractionForce

      progress.current.target += atractionResult
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
      progress.current.target = THREE.MathUtils.clamp(
        progress.current.target + e.deltaY / pxDuration,
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
        <BezierDropArea onDrop={setCameraPositions} />
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
        curve tangent's direction or world's{' '}
        <code style={{ whiteSpace: 'nowrap' }}>(0, 0, 0)</code>
      </li>
    </ul>
    <navUITunnel.Out />
  </Formated>
)
BezierTests.Tags = 'private'

export default BezierTests
