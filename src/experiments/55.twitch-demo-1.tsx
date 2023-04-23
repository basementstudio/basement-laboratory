import keyBy from 'lodash/keyBy'
import range from 'lodash/range'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { HTMLLayout } from '~/components/layout/html-layout'
import { getWorld } from '~/lib/three'

const Twitch1Demo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return

    const { width: canvasWidth, height: canvasHeight } =
      canvas.getBoundingClientRect()

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(canvasWidth, canvasHeight, false)
    renderer.setPixelRatio(window.devicePixelRatio)

    /* CAMERA SETUP */
    const fov = 20
    const aspect = canvasWidth / canvasHeight
    const near = 0.1
    const far = 100
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    camera.position.z = 10

    /* SCENE SETUP */
    const scene = new THREE.Scene()

    const ambLight = new THREE.AmbientLight('white', 1)
    scene.add(ambLight)

    const dirLight = new THREE.DirectionalLight('white', 1)
    dirLight.position.set(0, 0, 1)
    scene.add(dirLight)

    // Dir light helper
    // const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 0.5)
    // scene.add(dirLightHelper)

    /* HELPERS */
    // const controls = new OrbitControls(camera, canvas)
    // controls.target.set(0, 0, 0)

    const world = getWorld(renderer, camera)

    /* RENDER LOOP */
    let frameId: number

    const objArray: {
      rx: number
      ry: number
      rz: number
      x: number
      y: number
      ref: THREE.Object3D
    }[] = []

    const viewportVerticalOffset = 0.2
    let offset = 0

    const render = () => {
      offset += 0.01

      objArray.forEach((obj, layer) => {
        if (!obj.ref) return

        obj.ref.rotation.set(
          (obj.rx += 0.001),
          (obj.ry += 0.004),
          (obj.rz += 0.005)
        )

        const { height, width } = world.getViewport(camera, [
          0,
          0,
          obj.ref.position.z
        ])
        const visibleRange = height * (1 + viewportVerticalOffset)

        const x = obj.x * width
        let y = obj.y * height + offset
        y %= visibleRange
        y -= visibleRange / 2

        obj.ref.position.set(x, y, -layer / 2)
      })

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(render)
    }

    /* LOAD MODEL */
    const gltfLoader = new GLTFLoader()

    gltfLoader
      .loadAsync('/models/twitch-logo.glb')
      /* MODEL SETUP */
      .then((gltf) => {
        const nodes = keyBy(gltf.scene.children, 'name')

        const group = new THREE.Group()

        group.add(nodes['Marco'])
        group.add(nodes['Relleno'])
        group.add(nodes['OJOS'])

        group.rotateX(Math.PI / 2)

        const amount = 40

        range(amount).forEach(() => {
          const currGroup = group.clone()

          objArray.push({
            rx: Math.random() * Math.PI,
            rz: Math.random() * Math.PI,
            ry: THREE.MathUtils.randFloat(8, 12),
            x: THREE.MathUtils.randFloatSpread(1),
            y: THREE.MathUtils.randFloat(0, 1),
            ref: currGroup
          })

          scene.add(currGroup)
        })
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
      window.removeEventListener('resize', resizeHandler)
      cancelAnimationFrame(frameId)
      renderer.dispose()
      world.destroy()
    }
  }, [])

  return <canvas style={{ width: '100%', height: '100vh' }} ref={canvasRef} />
}

Twitch1Demo.Title = 'Twitch Demo No. 1'
Twitch1Demo.Description = (
  <>
    <p>Key points to learn with this demo:</p>
    <ul>
      <li>
        Initial setup of a ThreeJS scene with <code>WebGLRenderer</code>
      </li>
      <li>
        Basic ThreeJS concepts like <code>Mesh</code> <code>Geometry</code>{' '}
        <code>Material</code>
      </li>
      <li>
        How to load a <code>GLTF</code> model with <code>GLTFLoader</code>
      </li>
      <li>
        Understand the <code>%</code> module operation applied to range looping.
      </li>
    </ul>
  </>
)

Twitch1Demo.Tags = 'threejs,twitch'
Twitch1Demo.Layout = HTMLLayout

export default Twitch1Demo
