import { Euler, Matrix4, Vector3 } from 'three'
import * as THREE from 'three'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import { Clock } from 'three/src/core/Clock'
import { Raycaster } from 'three/src/core/Raycaster'
import { ArrowHelper } from 'three/src/helpers/ArrowHelper'
import { Vector2 } from 'three/src/math/Vector2'
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { Scene } from 'three/src/scenes/Scene'

import { safeWindow } from './constants'

export const trackCursor = (
  onMove?: (cursor: Vector2, event: MouseEvent) => void,
  target?: HTMLElement
) => {
  const hasMoved = { current: false }
  const firstRead = { current: true }
  const cursor = new Vector2(0, 0)

  const onMouseMove = (event: MouseEvent) => {
    if (!hasMoved.current) {
      hasMoved.current = true
    }

    cursor.x = (event.clientX / window.innerWidth) * 2 - 1
    cursor.y = -(event.clientY / window.innerHeight) * 2 + 1

    onMove?.(cursor, event)

    firstRead.current = false
  }

  const _target = target || safeWindow

  _target.addEventListener('mousemove', onMouseMove, {
    passive: true
  })

  return {
    get hasMoved() {
      return hasMoved.current
    },
    get firstRead() {
      return firstRead.current
    },
    cursor,
    destroy: () => {
      _target.removeEventListener('mousemove', onMouseMove)
    }
  }
}

/* ----------------------------------------------- */

export const defaultCamera = new PerspectiveCamera(
  40,
  (safeWindow.innerWidth || 0) / (safeWindow.innerHeight || 0),
  0.1,
  1000
)

defaultCamera.position.x = 0
defaultCamera.position.y = 0
defaultCamera.position.z = 5

/* ----------------------------------------------- */

type WindowSize = {
  width: number
  height: number
  ratio: number
}

export const getViewport = () => {
  const CALL_THRESHOLD_MS = 100
  const resizeTimeout: NodeJS.Timeout | null = null
  const size: WindowSize = {
    width: 0,
    height: 0,
    ratio: 0
  }

  const handleResize = (_e: any, immediate = false) => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
    const update = () => {
      size.width = window.innerWidth
      size.height = window.innerHeight
      size.ratio = window.innerWidth / window.innerHeight
    }

    if (immediate) {
      update()
    } else {
      setTimeout(update, CALL_THRESHOLD_MS)
    }
  }

  const destroy = () => {
    window.removeEventListener('resize', handleResize)

    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
  }

  window.addEventListener('resize', handleResize, { passive: true })
  handleResize(undefined, true)

  return {
    size,
    destroy
  }
}

/* ----------------------------------------------- */

type Rect = {
  width?: number
  height?: number
  left?: number
  top?: number
}

export const getWorld = (camera: THREE.PerspectiveCamera) => {
  const viewport = getViewport()

  const getHeight = (camera: THREE.PerspectiveCamera) => {
    const distance = camera.position.z
    const vFov = (camera.fov * Math.PI) / 180

    return 2 * Math.tan(vFov / 2) * distance
  }

  const height = getHeight(camera as THREE.PerspectiveCamera)
  const width = height * viewport.size.ratio

  const fromViewport = (rect: Pick<Rect, 'height' | 'width'>) => {
    const _width = (width * (rect?.width || 0)) / (viewport.size.width || 1)
    const _height = (height * (rect?.height || 0)) / (viewport.size.height || 1)

    return { width: _width, height: _height, x: _width, y: _height }
  }

  const fromBoundingRect = (rect: Rect) => {
    const size = fromViewport({
      width: rect.width,
      height: rect.height
    })

    const position = fromViewport({
      width: rect.left,
      height: rect.top
    })

    return {
      size,
      position: {
        x: position.width - width / 2 + size.width / 2,
        y: -(position.height - height / 2 + size.height / 2)
      }
    }
  }

  return {
    fromViewport,
    fromBoundingRect,
    destroy: viewport.destroy
  }
}

/* ----------------------------------------------- */

type CreateRendererArgs = {
  camera?: THREE.Camera
  rendererConfig: THREE.WebGLRendererParameters
  withRaycaster?: boolean
}

type EffectsFunc = (elapsedTime: number) => void

export const createWorld = ({
  camera = defaultCamera,
  rendererConfig,
  withRaycaster = false
}: CreateRendererArgs) => {
  const renderer = new WebGLRenderer(rendererConfig)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  let animationFrameId: number
  let oldElapsedTime = 0

  const clock = new Clock()
  const scene = new Scene()
  let raycaster:
    | (THREE.Raycaster & {
        helper?: ArrowHelper
        intersections?: ReturnType<THREE.Raycaster['intersectObjects']>
      })
    | undefined

  const cursorTracker = trackCursor()

  if (withRaycaster) {
    raycaster = new Raycaster()
    raycaster.intersections = []
  }

  let _getWorld: ReturnType<typeof getWorld> | undefined

  if (camera instanceof PerspectiveCamera) {
    _getWorld = getWorld(camera)
  }

  scene.add(camera)

  const update = (effect?: EffectsFunc) => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime

    oldElapsedTime = elapsedTime
    animationFrameId = requestAnimationFrame(() => update(effect))

    raycaster?.setFromCamera(cursorTracker.cursor, camera)
    raycaster?.helper?.setDirection(raycaster.ray.direction)

    const intersections = raycaster?.intersectObjects(scene.children)

    if (raycaster && intersections) {
      raycaster.intersections = intersections
    }

    effect?.(deltaTime)

    renderer.render(scene, camera)
  }

  const destroy = () => {
    cancelAnimationFrame(animationFrameId)
    _getWorld?.destroy()
    cursorTracker.destroy()
    scene.clear()
    renderer.dispose()
  }

  return {
    clock,
    renderer,
    scene,
    camera,
    update,
    destroy,
    raycaster,
    cursor: cursorTracker.cursor,
    getWorld: _getWorld
  }
}

export const setCameraLookAtEuler = (position: Vector3, target: Vector3) => {
  /*
  Camera records towards z: -1 of its own coordinate system so we need to use the Matrix4 transformation API
  wich supports this eye -> target coordinate system using the lookAt method. See the source code of the Object3D
  lookAt method for more details:
  
  https://github.com/mrdoob/three.js/blob/f021ec0c9051eb11d110b0c2b93305bffd0942e0/src/core/Object3D.js#L260
*/
  const m = new Matrix4()

  m.lookAt(position, target, new Vector3(0, 1, 0))

  return new Euler().setFromRotationMatrix(m)
}

type Curve = {
  id: number
  px: number
  py: number
  pz: number
  hlx: number
  hly: number
  hlz: number
  hrx: number
  hry: number
  hrz: number
}

/* 
  This works like:
  [..points, controls..]
                        -----> CubicBezierCurve3
  [..points, controls..]
                        -----> CubicBezierCurve3
  [..points, controls..]
                        -----> CubicBezierCurve3
  [..points, controls..]

  Returns an array of connected bezier curves you
  can then add to a CurvePath to get a path.
*/

export const getBezierCurves = (curve: Curve[], scale = 1) => {
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
