import * as THREE from 'three'

import { safeWindow } from './constants'

const defaultCamera = new THREE.PerspectiveCamera(
  75,
  (safeWindow.innerWidth || 0) / (safeWindow.innerHeight || 0),
  0.1,
  100
)

defaultCamera.position.x = 0
defaultCamera.position.y = 0
defaultCamera.position.z = 5

type CreateRendererArgs = {
  camera?: THREE.Camera
  rendererConfig: THREE.WebGLRendererParameters
}

type EffectsFunc = (elapsedTime: number) => void

export const createWorld = ({
  camera = defaultCamera,
  rendererConfig
}: CreateRendererArgs) => {
  const renderer = new THREE.WebGLRenderer(rendererConfig)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  let animationFrameId: number
  let oldElapsedTime = 0

  const clock = new THREE.Clock()
  const scene = new THREE.Scene()

  scene.add(camera)

  const update = (effect?: EffectsFunc) => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime

    oldElapsedTime = elapsedTime
    animationFrameId = requestAnimationFrame(() => update(effect))

    effect?.(deltaTime)

    renderer.render(scene, camera)
  }

  const destroy = () => {
    cancelAnimationFrame(animationFrameId)
    scene.clear()
    renderer.dispose()
  }

  return { renderer, scene, camera, update, destroy }
}
