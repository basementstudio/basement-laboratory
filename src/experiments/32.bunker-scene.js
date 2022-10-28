import { useGLTF } from '@react-three/drei'
import { createRoot, events, extend, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { DURATION, gsap } from 'lib/gsap'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { AspectBox } from '~/components/common/aspect-box'
import { useLoader } from '~/components/common/loader'

import { NavigationLayout } from '../components/layout/navigation-layout'
import { trackCursor } from '../lib/three'

extend(THREE)

const config = {
  modelSrc: 'bunker.glb',
  camera: {
    position: new THREE.Vector3(0.7507294368005816, -2, 8.688852630592953),
    rotation: new THREE.Euler(
      0.3679671281735305,
      0.06208526103691726,
      -0.023915566989092085
    ),
    rotationMultiplier: {
      x: 0.001,
      y: 0.001
    }
  }
}

const BunkerScene = () => {
  const { gl, camera } = useThree((state) => ({
    gl: state.gl,
    camera: state.camera
  }))
  const setLoaded = useLoader((s) => s.setLoaded)
  const model = useGLTF(
    `/models/${config.modelSrc}`,
    undefined,
    undefined,
    (loader) => {
      loader.manager.onLoad = () => setLoaded()
    }
  )

  const controls = useControls({
    /* Fog */
    fogColor: { value: '#1d1d1d' },
    // fogDensity: { min: 0, max: 0.1, value: 0.05, step: 0.0001 },
    fogNear: { min: 0, max: 100, value: 8.8, step: 0.1 },
    fogFar: { min: 0, max: 100, value: 9.6, step: 0.1 },

    /* Light */
    hemisphereLightTop: { value: '#ffffff' },
    hemisphereLightBottom: { value: '#ffffff' },
    hemisphereLightIntensity: { value: 1, min: 0, max: 10, step: 0.1 },
    ambientLightIntensity: { value: 0.8, min: 0, max: 1, step: 0.01 }
  })

  const updateCam = useMemo(() => {
    const target = new THREE.Vector3(0.1, 0.55, 0)
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

    return ({ x = 0, y = 0, immediate = false }) => {
      // This takes the mouse position and converts it to spherical coordinates -1 to 1 is a complete circunference
      sphericalDelta.theta =
        (gl.domElement.clientHeight * Math.PI * x) /
        gl.domElement.clientHeight /
        40 /* This controls the portion of the circunference to rotate (1 / 40) */
      sphericalDelta.phi =
        -(
          (gl.domElement.clientHeight * Math.PI * y) /
          gl.domElement.clientHeight
        ) /
        30 /* This controls the portion of the circunference to rotate (1 / 30) */

      // Update the camera
      offset.copy(config.camera.position).sub(target)

      // rotate offset to "y-axis-is-up" space
      offset.applyQuaternion(quat)

      // angle from z-axis around y-axis
      spherical.setFromVector3(offset)

      spherical.theta += sphericalDelta.theta
      spherical.phi += sphericalDelta.phi

      offset.setFromSpherical(spherical)

      offset.applyQuaternion(quatInverse)

      gsap[immediate ? 'set' : 'to'](camera.position, {
        overwrite: true,
        duration: DURATION,
        x: offset.x,
        y: offset.y,
        z: offset.z,
        ease: 'power2.out',
        onUpdate: () => {
          camera.lookAt(target)
        }
      })

      sphericalDelta.set(0, 0, 0)
    }
  }, [camera, gl])

  useLayoutEffect(() => {
    // return

    updateCam({ immediate: true })

    const mouseTracker = trackCursor((cursor) => {
      updateCam({ x: cursor.x, y: cursor.y })
    }, gl.domElement)

    return mouseTracker.destroy
  }, [updateCam, gl.domElement])

  return (
    <>
      <fog
        attach="fog"
        args={[controls.fogColor, controls.fogNear, controls.fogFar]}
      />
      {/* <fogExp2 attach="fog" args={[controls.fogColor, controls.fogDensity]} /> */}
      {/* <OrbitControls /> */}
      {/* <color attach="background" args={['red']} /> */}
      <ambientLight intensity={controls.ambientLightIntensity} />
      {/* <hemisphereLight
        args={[
          controls.hemisphereLightTop,
          controls.hemisphereLightBottom,
          controls.hemisphereLightIntensity
        ]}
      /> */}
      <group
        position={[0, -3, 0]}
        rotation={[0, -Math.PI / 5.5, 0]}
        scale={0.2}
      >
        <primitive object={model.scene} />
      </group>
    </>
  )
}

BunkerScene.Title = 'Bunker Scene'
BunkerScene.Tags = 'three,private'
BunkerScene.Layout = ({ title, description, slug }) => {
  const canvasRef = useRef()
  const aspectBoxRef = useRef()

  useEffect(() => {
    const root = createRoot(canvasRef.current)

    root.configure({
      events,
      camera: {
        position: new THREE.Vector3().copy(config.camera.position),
        rotation: new THREE.Euler().copy(config.camera.rotation),
        fov: 10
      }
    })

    window.addEventListener('resize', () => {
      root.configure({
        size: {
          width: aspectBoxRef.current.clientWidth,
          height: aspectBoxRef.current.clientHeight
        }
      })
    })

    window.dispatchEvent(new Event('resize'))

    root.render(<BunkerScene />)

    return root.unmount
  }, [])

  return (
    <NavigationLayout title={title} description={description} slug={slug}>
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center'
        }}
      >
        <AspectBox
          style={{ position: 'relative', width: '100%' }}
          ratio={21 / 9}
          ref={aspectBoxRef}
        >
          <canvas style={{ position: 'absolute', inset: 0 }} ref={canvasRef} />
        </AspectBox>
      </div>
    </NavigationLayout>
  )
}

export default BunkerScene
