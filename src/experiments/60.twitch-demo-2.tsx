import keyBy from 'lodash/keyBy'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// @ts-ignore
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { EmptyLayout } from '~/components/layout/empty-layout'
import { trackCursor } from '~/lib/three'

const Twitch2Demo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.style.setProperty('overscroll-behavior', 'none')
    document.documentElement.style.setProperty('overflow', 'hidden')

    return () => {
      document.documentElement.style.removeProperty('overscroll-behavior')
      document.documentElement.style.removeProperty('overflow')
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const progress = progressRef.current

    if (!canvas || !progress) return

    /* RENDERER SETUP */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      // @ts-ignore
      outputColorSpace: THREE.SRGBColorSpace,
      toneMapping: THREE.LinearToneMapping
    })
    const { width: canvasWidth, height: canvasHeight } =
      canvas.getBoundingClientRect()
    renderer.setSize(canvasWidth, canvasHeight, false)
    renderer.setPixelRatio(window.devicePixelRatio)

    /* STATS */
    const stats = new Stats()
    document.body.appendChild(stats.dom)

    /* CAMERA SETUP */
    const fov = 20
    const aspect = canvasWidth / canvasHeight
    const near = 0.1
    const far = 100
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    camera.position.z = 15

    /* SCENE SETUP */
    const scene = new THREE.Scene()

    const baseLightIntensity = 0.15
    const lightIntensityRange = 0.4

    const dirLightColor = new THREE.DirectionalLight(
      '#ec5a29',
      baseLightIntensity
    )
    dirLightColor.position.set(-3, -2.5, 3)
    scene.add(dirLightColor)

    const dirLightWhite = new THREE.DirectionalLight('#fff', baseLightIntensity)
    dirLightWhite.position.set(3, 2.5, 3)
    scene.add(dirLightWhite)

    /* HELPERS */
    const controls = new OrbitControls(camera, canvas)
    controls.target.set(0, 0, 0)
    controls.enabled = false

    const axesHelper = new THREE.AxesHelper(1)
    axesHelper.visible = false
    scene.add(axesHelper)

    const gridHelper = new THREE.GridHelper(10, 10)
    gridHelper.visible = false
    scene.add(gridHelper)

    const dirLightColorHelper = new THREE.DirectionalLightHelper(
      dirLightColor,
      0.5
    )
    dirLightColorHelper.visible = false
    scene.add(dirLightColorHelper)

    const dirLightWhiteHelper = new THREE.DirectionalLightHelper(
      dirLightWhite,
      0.5
    )
    dirLightWhiteHelper.visible = false
    scene.add(dirLightWhiteHelper)

    /* TRACK CURSOR */
    const cursorTracker = trackCursor()

    /* TRACK WHEEL */
    let wheelDelta = 0
    let wheelScrollTarget = 0
    let wheelScroll = 0

    const onWheel = (e: WheelEvent) => {
      wheelDelta = e.deltaY * 0.002
      wheelScrollTarget += wheelDelta
      snapGroupTargetRotation += wheelDelta
    }

    window.addEventListener('wheel', onWheel)

    /* RENDER LOOP */
    let frameId: number
    let screenTexture: THREE.Texture
    let monitor: THREE.Object3D
    let snapGroup: THREE.Group
    let snapGroupTargetRotation = 0

    const render = () => {
      controls.update()

      if (monitor && snapGroup) {
        const lerpAmount = 0.1

        // Animate the scroll
        wheelScroll = THREE.MathUtils.lerp(
          wheelScroll,
          wheelScrollTarget,
          lerpAmount
        )
        const deltaScroll = wheelScroll - wheelScrollTarget

        progress.style.width = `${THREE.MathUtils.clamp(
          Math.abs(deltaScroll * 0.1) * 100,
          0,
          100
        ).toFixed(2)}%`

        /* Animate monitor */
        const rangeOfMovementRad = Math.PI / 4

        monitor.rotation.x = THREE.MathUtils.lerp(
          monitor.rotation.x,
          -cursorTracker.cursor.y * rangeOfMovementRad,
          lerpAmount
        )

        monitor.rotation.y = THREE.MathUtils.lerp(
          monitor.rotation.y,
          cursorTracker.cursor.x * rangeOfMovementRad,
          lerpAmount
        )

        /* Rotation snap point */
        const snapPoint = 0
        const snapPointAttractionForce = 0.2 // How much the snap point attracts the rotation
        const distanceToSnapPointShortestDelta =
          ((snapGroup.rotation.y - snapPoint + Math.PI) % (Math.PI * 2)) -
          Math.PI

        // > Normalized in terms of PI radians, -1 is -180 degrees away, 1 is 180 degrees away
        const normalizedDistanceToSnapPoint =
          distanceToSnapPointShortestDelta / Math.PI

        // > How much the snap point attracts the monitor rotation with the current rotation value
        const resultantSnapForce =
          -normalizedDistanceToSnapPoint * snapPointAttractionForce

        // > Apply snap force to target rotation
        snapGroupTargetRotation += resultantSnapForce

        /* Animate screen texture */
        const rounds = snapGroup.rotation.y / (Math.PI * 2)
        screenTexture.offset.y = rounds / 2 // Divided by two bc the txt is half angy half neutral

        /* Lerp rotation to target */
        snapGroup.rotation.y = THREE.MathUtils.lerp(
          snapGroup.rotation.y,
          snapGroupTargetRotation,
          lerpAmount
        )

        /* Animate lights */
        const whiteLightIntensity =
          baseLightIntensity +
          Math.max(cursorTracker.cursor.x, 0) * lightIntensityRange
        const colorLightIntensity =
          baseLightIntensity +
          -Math.min(cursorTracker.cursor.x, 0) * lightIntensityRange

        dirLightWhite.intensity = THREE.MathUtils.lerp(
          dirLightWhite.intensity,
          whiteLightIntensity,
          lerpAmount
        )
        dirLightColor.intensity = THREE.MathUtils.lerp(
          dirLightWhite.intensity,
          colorLightIntensity,
          lerpAmount
        )
      }

      renderer.render(scene, camera)

      stats.update()
      frameId = requestAnimationFrame(render)
    }

    /* LOAD MODEL */
    const gltfLoader = new GLTFLoader()
    gltfLoader.setMeshoptDecoder(MeshoptDecoder)

    gltfLoader
      .loadAsync('/models/Monitor-Looper.glb')
      /* MODEL SETUP */
      .then((gltf) => {
        const nodes = keyBy(gltf.scene.children, 'name')

        monitor = nodes['Monitor']
        monitor.scale.set(1.2, 1.2, 1.2)

        // Do not render inside the monitor
        ;(monitor.children[0] as any).material.side = THREE.FrontSide

        // Get the screen texture
        screenTexture = (monitor.children[1] as any).material.map

        snapGroup = new THREE.Group()
        snapGroup.add(monitor)

        scene.add(snapGroup)
      })
      /* START LOOP */
      .then(() => {
        frameId = requestAnimationFrame(render)
      })

    const resizeHandler = () => {
      const { width, height } = canvas.getBoundingClientRect()

      camera.aspect = width / height
      camera.updateProjectionMatrix()

      renderer.setSize(width, height, false)
      renderer.setPixelRatio(window.devicePixelRatio)
    }

    window.addEventListener('resize', resizeHandler, { passive: true })

    return () => {
      stats.dom.remove()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', resizeHandler)
      cancelAnimationFrame(frameId)
      renderer.dispose()
      cursorTracker.destroy()
    }
  }, [])

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '5vh',
          background: 'black',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 400,
            height: 48,
            marginTop: 12,
            borderRadius: '9999px',
            overflow: 'hidden',
            border: '1px solid #ec5a29'
          }}
        >
          <div
            style={{
              background: 'white',
              height: '100%',
              width: 0,
              borderRadius: '9999px'
            }}
            ref={progressRef}
          />
          <p
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 'max-content',
              transform: 'translate(-50%, -50%)',
              fontFamily: 'Basement Grotesque Display',
              mixBlendMode: 'difference'
            }}
          >
            Wheel force
          </p>
        </div>
      </div>

      <canvas style={{ width: '100%', height: '100vh' }} ref={canvasRef} />
    </>
  )
}

Twitch2Demo.Title = 'Twitch Demo No. 2'
Twitch2Demo.Description = <></>
Twitch2Demo.Tags = 'threejs,twitch'
Twitch2Demo.Layout = EmptyLayout

export default Twitch2Demo
