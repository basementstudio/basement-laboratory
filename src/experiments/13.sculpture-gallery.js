import dynamic from 'next/dynamic'
import * as THREE from 'three'
import { OctreeHelper } from 'three/examples/jsm/helpers/OctreeHelper.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { Capsule } from 'three/examples/jsm/math/Capsule'
import { Octree } from 'three/examples/jsm/math/Octree'

import { Loader, useLoader } from '../components/common/loader'
import { Script } from '../components/common/script'
import { PlainCanvasLayout } from '../components/layout/plain-canvas-layout.tsx'
import { createWorld } from '../lib/three'

const VRButton = dynamic(() => import('three/examples/jsm/webxr/VRButton'), {
  ssr: false
})

const SculptureGallery = () => {
  const canvas = document.querySelector('#canvas')

  const { destroy, camera, scene, renderer, update } = createWorld({
    rendererConfig: {
      canvas,
      antialias: true
    }
  })

  scene.background = new THREE.Color(0x7696b1)
  scene.fog = new THREE.Fog(0x7696b1, 1, 30)

  camera.rotation.order = 'YXZ'

  const fillLight1 = new THREE.HemisphereLight(0x7696b1, 0x979590, 0.8)
  fillLight1.position.set(100, 0, 0)
  scene.add(fillLight1)

  const directionalLight = new THREE.DirectionalLight(0x7696b1, 0.5)
  directionalLight.position.set(100, 100, 100)
  directionalLight.castShadow = false
  directionalLight.shadow.camera.near = 0.01
  directionalLight.shadow.camera.far = 300
  directionalLight.shadow.camera.right = 30
  directionalLight.shadow.camera.left = -30
  directionalLight.shadow.camera.top = 100
  directionalLight.shadow.camera.bottom = -30
  directionalLight.shadow.mapSize.width = 2024
  directionalLight.shadow.mapSize.height = 2024
  directionalLight.shadow.radius = 4
  directionalLight.shadow.bias = -0.00006
  scene.add(directionalLight)

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.VSMShadowMap
  renderer.outputEncoding = THREE.sRGBEncoding

  const GRAVITY = 30
  const NUM_SPHERES = 200
  const SPHERE_RADIUS = 0.05
  const STEPS_PER_FRAME = 5

  const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5)
  const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })

  const spheres = []
  let sphereIdx = 0

  for (let i = 0; i < NUM_SPHERES; i++) {
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.castShadow = true
    sphere.receiveShadow = true

    scene.add(sphere)

    spheres.push({
      mesh: sphere,
      collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
      velocity: new THREE.Vector3()
    })
  }

  const worldOctree = new Octree()

  const playerCollider = new Capsule(
    new THREE.Vector3(0, 0.35, 0),
    new THREE.Vector3(0, 1, 0),
    0.35
  )

  const playerVelocity = new THREE.Vector3()
  const playerDirection = new THREE.Vector3()

  let playerOnFloor = false
  let mouseTime = 0

  const keyStates = {}

  const vector1 = new THREE.Vector3()
  const vector2 = new THREE.Vector3()
  const vector3 = new THREE.Vector3()

  const supportsVR = 'getVRDisplays' in navigator

  if (supportsVR) {
    document.body.appendChild(VRButton.createButton(renderer))
    renderer.xr.enabled = true

    renderer.setAnimationLoop(function () {
      renderer.render(scene, camera)
    })
  }

  const handleMouseMove = (event) => {
    if (document.pointerLockElement === document.body) {
      camera.rotation.y -= event.movementX / 500
      camera.rotation.x -= event.movementY / 500
    }
  }

  const handleMouseUp = () => {
    if (document.pointerLockElement !== null) throwBall()
  }

  const handleMouseDown = () => {
    document.body.requestPointerLock()

    mouseTime = performance.now()
  }

  const handleKeyUp = (event) => {
    keyStates[event.code] = false
  }

  const handleKeyDown = (event) => {
    keyStates[event.code] = true
  }

  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('resize', onWindowResize)

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  function throwBall() {
    const sphere = spheres[sphereIdx]

    camera.getWorldDirection(playerDirection)

    sphere.collider.center
      .copy(playerCollider.end)
      .addScaledVector(playerDirection, playerCollider.radius * 1.5)

    // throw the ball with more force if we hold the button longer, and if we move forward

    const impulse =
      15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001))

    sphere.velocity.copy(playerDirection).multiplyScalar(impulse)
    sphere.velocity.addScaledVector(playerVelocity, 2)

    sphereIdx = (sphereIdx + 1) % spheres.length
  }

  function playerCollisions() {
    const result = worldOctree.capsuleIntersect(playerCollider)

    playerOnFloor = false

    if (result) {
      playerOnFloor = result.normal.y > 0

      if (!playerOnFloor) {
        playerVelocity.addScaledVector(
          result.normal,
          -result.normal.dot(playerVelocity)
        )
      }

      playerCollider.translate(result.normal.multiplyScalar(result.depth))
    }
  }

  function updatePlayer(deltaTime) {
    let damping = Math.exp(-4 * deltaTime) - 1

    if (!playerOnFloor) {
      playerVelocity.y -= GRAVITY * deltaTime

      // small air resistance
      damping *= 0.1
    }

    playerVelocity.addScaledVector(playerVelocity, damping)

    const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime)
    playerCollider.translate(deltaPosition)

    playerCollisions()

    camera.position.copy(playerCollider.end)
  }

  function playerSphereCollision(sphere) {
    const center = vector1
      .addVectors(playerCollider.start, playerCollider.end)
      .multiplyScalar(0.5)

    const sphere_center = sphere.collider.center

    const r = playerCollider.radius + sphere.collider.radius
    const r2 = r * r

    // approximation: player = 3 spheres

    for (const point of [playerCollider.start, playerCollider.end, center]) {
      const d2 = point.distanceToSquared(sphere_center)

      if (d2 < r2) {
        const normal = vector1.subVectors(point, sphere_center).normalize()
        const v1 = vector2
          .copy(normal)
          .multiplyScalar(normal.dot(playerVelocity))
        const v2 = vector3
          .copy(normal)
          .multiplyScalar(normal.dot(sphere.velocity))

        playerVelocity.add(v2).sub(v1)
        sphere.velocity.add(v1).sub(v2)

        const d = (r - Math.sqrt(d2)) / 2
        sphere_center.addScaledVector(normal, -d)
      }
    }
  }

  function spheresCollisions() {
    for (let i = 0, length = spheres.length; i < length; i++) {
      const s1 = spheres[i]

      for (let j = i + 1; j < length; j++) {
        const s2 = spheres[j]

        const d2 = s1.collider.center.distanceToSquared(s2.collider.center)
        const r = s1.collider.radius + s2.collider.radius
        const r2 = r * r

        if (d2 < r2) {
          const normal = vector1
            .subVectors(s1.collider.center, s2.collider.center)
            .normalize()
          const v1 = vector2
            .copy(normal)
            .multiplyScalar(normal.dot(s1.velocity))
          const v2 = vector3
            .copy(normal)
            .multiplyScalar(normal.dot(s2.velocity))

          s1.velocity.add(v2).sub(v1)
          s2.velocity.add(v1).sub(v2)

          const d = (r - Math.sqrt(d2)) / 2

          s1.collider.center.addScaledVector(normal, d)
          s2.collider.center.addScaledVector(normal, -d)
        }
      }
    }
  }

  function updateSpheres(deltaTime) {
    spheres.forEach((sphere) => {
      sphere.collider.center.addScaledVector(sphere.velocity, deltaTime)

      const result = worldOctree.sphereIntersect(sphere.collider)

      if (result) {
        sphere.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(sphere.velocity) * 1.5
        )
        sphere.collider.center.add(result.normal.multiplyScalar(result.depth))
      } else {
        sphere.velocity.y -= GRAVITY * deltaTime
      }

      const damping = Math.exp(-1.5 * deltaTime) - 1
      sphere.velocity.addScaledVector(sphere.velocity, damping)

      playerSphereCollision(sphere)
    })

    spheresCollisions()

    for (const sphere of spheres) {
      sphere.mesh.position.copy(sphere.collider.center)
    }
  }

  function getForwardVector() {
    camera.getWorldDirection(playerDirection)
    playerDirection.y = 0
    playerDirection.normalize()

    return playerDirection
  }

  function getSideVector() {
    camera.getWorldDirection(playerDirection)
    playerDirection.y = 0
    playerDirection.normalize()
    playerDirection.cross(camera.up)

    return playerDirection
  }

  function controls(deltaTime) {
    // gives a bit of air control
    const speedDelta = deltaTime * (playerOnFloor ? 25 : 8)

    if (keyStates['KeyW']) {
      playerVelocity.add(getForwardVector().multiplyScalar(speedDelta))
    }

    if (keyStates['KeyS']) {
      playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta))
    }

    if (keyStates['KeyA']) {
      playerVelocity.add(getSideVector().multiplyScalar(-speedDelta))
    }

    if (keyStates['KeyD']) {
      playerVelocity.add(getSideVector().multiplyScalar(speedDelta))
    }

    if (playerOnFloor) {
      if (keyStates['Space']) {
        playerVelocity.y = 15
      }
    }
  }

  const loadingManager = new THREE.LoadingManager()
  loadingManager.onLoad = () => {
    useLoader.getState().setLoaded()
  }

  new RGBELoader(loadingManager)
    .setPath('/images/')
    .load('royal_esplanade_1k.hdr', function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping

      //scene.background = texture;
      scene.environment = texture
    })

  const loader = new GLTFLoader(loadingManager).setPath('/models/')
  let model, mixer

  loader.load('SculptureGallery.gltf', (gltf) => {
    model = gltf.scene
    scene.add(model)

    worldOctree.fromGraphNode(gltf.scene)

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true

        if (child.material.map) {
          child.material.map.anisotropy = 4
        }
      }
    })

    const helper = new OctreeHelper(worldOctree)
    helper.visible = false
    scene.add(helper)

    // const gui = new GUI({ width: 200 })
    // gui.add({ debug: false }, 'debug').onChange(function (value) {
    //   helper.visible = value
    // })

    mixer = new THREE.AnimationMixer(model)
    mixer.clipAction(gltf.animations[0]).play()

    update((delta) => {
      const deltaTime = delta / STEPS_PER_FRAME

      // we look for collisions in substeps to mitigate the risk of
      // an object traversing another too quickly for detection.
      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        controls(deltaTime)

        updatePlayer(deltaTime)

        updateSpheres(deltaTime)

        teleportPlayerIfOob()
      }
    })
  })

  function teleportPlayerIfOob() {
    if (camera.position.y <= -25) {
      playerCollider.start.set(0, 0.35, 0)
      playerCollider.end.set(0, 1, 0)
      playerCollider.radius = 0.35
      camera.position.copy(playerCollider.end)
      camera.rotation.set(0, 0, 0)
    }
  }

  return () => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
    document.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('resize', onWindowResize)
    destroy()
  }
}

SculptureGallery.getLayout = ({ Component: fn, ...rest }) => (
  <PlainCanvasLayout {...rest}>
    <Loader />
    <Script fn={fn} />
  </PlainCanvasLayout>
)

SculptureGallery.Title = 'Sculpture Gallery'
SculptureGallery.Tags = '3d,experience'

export default SculptureGallery
