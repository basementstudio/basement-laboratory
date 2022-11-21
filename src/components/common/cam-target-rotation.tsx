import { tunnel } from '@basementstudio/definitive-scroll'
import { useThree } from '@react-three/fiber'
import { DURATION, gsap } from 'lib/gsap'
import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import * as THREE from 'three'

import { useGsapContext } from '~/hooks/use-gsap-context'
import { trackCursor } from '~/lib/three'

import { AspectCanvas } from './aspect-canvas'

export const CamTargetRotation = memo<{
  initialCamPosition: THREE.Vector3
  target: THREE.Vector3
  showTargetHelper?: boolean
  rotationMultipliers?: {
    x: number
    y: number
  }
  autoRotate?: boolean
  debug?: boolean
}>(
  ({
    target,
    initialCamPosition,
    rotationMultipliers = { x: 1 / 2, y: 1 / 2 },
    showTargetHelper = false,
    autoRotate: autoRotateProp = false,
    debug = false
  }) => {
    const arrowRef = useRef<THREE.ArrowHelper>(null)
    const prevAutoRotate = useRef<boolean>()
    const [autoRotate, setAutoRotate] = useState(autoRotateProp)

    const { camera } = useThree((state) => ({
      gl: state.gl,
      camera: state.camera
    }))

    const calculateCamPosOnSphericalCoords = useMemo(() => {
      const offset = new THREE.Vector3()

      /* I don't understand this, quaternions are difficult AF */
      const quat = new THREE.Quaternion().setFromUnitVectors(
        camera.up,
        new THREE.Vector3(0, 1, 0)
      )
      const quatInverse = quat.clone().invert()

      // current position in spherical coordinates
      const spherical = new THREE.Spherical()
      const sphericalDelta = new THREE.Spherical()

      return ({ x = 0, y = 0 }) => {
        // This takes the mouse position and converts it to spherical coordinates -1 to 1 is a complete circunference
        sphericalDelta.theta = Math.PI * x * rotationMultipliers.x
        sphericalDelta.phi = -(Math.PI * y) * rotationMultipliers.y

        /* Target is the point where the cam should be looking at. AKA the center if the sphere. */
        offset
          .copy(initialCamPosition)
          .sub(target) /* Get the cam initial position to target vector */

        // rotate offset to "y-axis-is-up" space
        offset.applyQuaternion(quat)

        // angle from z-axis around y-axis
        spherical.setFromVector3(offset)

        spherical.theta += sphericalDelta.theta
        spherical.phi += sphericalDelta.phi

        offset.setFromSpherical(spherical)

        offset.applyQuaternion(quatInverse)

        if (arrowRef.current) {
          const offsetDirectionVec = offset.clone().normalize()
          const offsetLength = offset.length()

          arrowRef.current.setDirection(offsetDirectionVec)
          arrowRef.current.setLength(offsetLength)
          arrowRef.current.position.copy(target)
        }

        return { target: target, offset }
      }
    }, [camera, target, initialCamPosition, rotationMultipliers])

    const updateCam = useCallback(
      ({ x = 0, y = 0, immediate = false }) => {
        const { offset, target } = calculateCamPosOnSphericalCoords({ x, y })
        const finalCamPosition = target.clone().add(offset)

        gsap[immediate ? 'set' : 'to'](camera.position, {
          overwrite: true,
          duration: DURATION,
          z: finalCamPosition.z,
          x: finalCamPosition.x,
          y: finalCamPosition.y,
          ease: 'power2.out',
          onUpdate: () => {
            camera.lookAt(target)
          }
        })
      },
      [calculateCamPosOnSphericalCoords, camera]
    )

    /* Mouse animation */
    useLayoutEffect(() => {
      const TIMEOUT_DURATION = 2500
      let timeoutId: NodeJS.Timeout

      updateCam({ x: Math.sin(0), y: Math.cos(Math.PI / 2), immediate: true })

      const mouseTracker = trackCursor((cursor) => {
        autoRotateProp && setAutoRotate(false)

        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
          autoRotateProp && setAutoRotate(true)
          clearTimeout(timeoutId)
        }, TIMEOUT_DURATION)

        updateCam({ x: cursor.x, y: cursor.y })
      })

      return mouseTracker.destroy
    }, [updateCam, autoRotateProp])

    /* Automatic animation */
    useGsapContext(() => {
      if (!autoRotate) {
        return () => {
          prevAutoRotate.current = autoRotate
        }
      }

      const { offset, target } = calculateCamPosOnSphericalCoords({
        x: Math.sin(0),
        y: Math.cos(0)
      })
      const trgt = { x: 0, y: 0 }

      const FULL_ROTATION_DURATION = DURATION * 80

      const timeline = gsap.timeline()

      if (prevAutoRotate.current !== undefined) {
        const finalCamPosition = target.clone().add(offset)

        timeline.to(camera.position, {
          duration: FULL_ROTATION_DURATION / 4,
          ease: 'none',
          z: finalCamPosition.z,
          x: finalCamPosition.x,
          y: finalCamPosition.y,
          onUpdate: () => {
            camera.lookAt(target)
          }
        })
      }

      timeline.to(trgt, {
        duration: FULL_ROTATION_DURATION,
        repeat: -1,
        ease: 'none',

        x: Math.PI * 2,
        y: Math.PI * 2,

        onUpdate: () => {
          const resX = Math.sin(trgt.x)
          const resY = Math.cos(trgt.y)

          updateCam({
            x: resX,
            y: resY,
            immediate: true
          })
        }
      })

      return () => {
        prevAutoRotate.current = autoRotate
      }
    }, [updateCam, autoRotate, camera])

    return (
      <>
        {showTargetHelper && (
          <mesh position={target}>
            <axesHelper />
            <sphereBufferGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="red" />
          </mesh>
        )}

        {debug && (
          <DebugPanelWebGL.In>
            <arrowHelper ref={arrowRef} />
          </DebugPanelWebGL.In>
        )}
      </>
    )
  }
)

const DebugPanelWebGL = tunnel()

export const DebugPanelCanvas = memo(({ children }) => {
  return (
    <AspectCanvas
      fullHeight={false}
      ratio={1}
      config={{ camera: { position: [2.5, 4, 2.5], fov: 30 } }}
    >
      <DebugPanelWebGL.Out />
      {children}
    </AspectCanvas>
  )
})
