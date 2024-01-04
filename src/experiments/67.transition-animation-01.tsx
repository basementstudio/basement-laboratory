import { gsap } from 'lib/gsap'
import { Spherical } from 'three'
import { Euler } from 'three/src/math/Euler'
import { Matrix4 } from 'three/src/math/Matrix4'
import { Quaternion } from 'three/src/math/Quaternion'
import { Vector3 } from 'three/src/math/Vector3'

import { Script } from '~/components/common/script'
import { PlainCanvasLayout } from '~/components/layout/plain-canvas-layout'

const width = window.innerWidth
const height = window.innerHeight

const getCameraPositionAndRotationFromSphericalCoords = (
  radius: number,
  phi: number,
  theta: number
) => {
  const spherical = new Spherical(radius, phi, theta)
  const rotation = new Quaternion()
  const position = new Vector3()

  position.setFromSpherical(spherical)
  rotation.setFromEuler(new Euler(phi, theta, 0))

  return {
    position,
    rotation
  }
}

const e = new Euler()
const v = new Vector3()

const globalMatrix = new Matrix4()
const globalRotation = new Quaternion()
const globalPosition = new Vector3()

/* Camera */
const projectionMatrix = new Matrix4()

projectionMatrix.makeOrthographic(
  -width / 2,
  width / 2,
  height / 2,
  -height / 2,
  0.1,
  1000,
  2000
)
const inverseProjectionMatrix = new Matrix4()
inverseProjectionMatrix.copy(projectionMatrix).invert()
const camMatrix = new Matrix4()

const cam = getCameraPositionAndRotationFromSphericalCoords(
  1,
  Math.PI / 4,
  -Math.PI / 4 + Math.PI
)
cam.position.add(v.set(width / 2, height / 2, 0))
camMatrix.compose(cam.position, cam.rotation, new Vector3(1, 1, 1))

const easings = {
  inOutExpo(x: number): number {
    return x === 0
      ? 0
      : x === 1
      ? 1
      : x < 0.5
      ? Math.pow(2, 20 * x - 10) / 2
      : (2 - Math.pow(2, -20 * x + 10)) / 2
  },
  outQuint(x: number): number {
    return 1 - Math.pow(1 - x, 5)
  },
  outCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3)
  },
  inOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
  },
  inCubic(x: number): number {
    return x * x * x
  }
}

class Geometry {
  position: Vector3
  rotation: Euler
  quaternion: Quaternion
  scale: Vector3
  matrix: Matrix4

  constructor() {
    this.position = new Vector3()
    this.rotation = new Euler()
    this.scale = new Vector3()
    this.quaternion = new Quaternion()
    this.matrix = new Matrix4()

    const onRotationChange = () => {
      this.quaternion.setFromEuler(this.rotation, false)
    }

    const onQuaternionChange = () => {
      this.rotation.setFromQuaternion(this.quaternion, undefined, false)
    }

    this.rotation._onChange(onRotationChange)
    this.quaternion._onChange(onQuaternionChange)
  }

  updateMatrix() {
    this.matrix.compose(this.position, this.quaternion, this.scale)
    this.matrix.premultiply(globalMatrix)
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  draw() {}
}

const main = () => {
  // Get the canvas element from the DOM
  const canvas = document.getElementById('canvas') as HTMLCanvasElement

  if (!canvas) return

  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight

  // Store the 2D context
  const ctx = canvas.getContext('2d')

  if (!ctx) return

  if (window.devicePixelRatio > 1) {
    canvas.width = canvas.clientWidth * 2
    canvas.height = canvas.clientHeight * 2
    ctx.scale(2, 2)
  }

  /* ====================== */
  /* ====== VARIABLES ===== */
  /* ====================== */
  let width = canvas.clientWidth // Width of the canvas
  let height = canvas.clientHeight // Height of the canvas
  const geometries: Geometry[] = [] // Every dots in an array

  class Cube extends Geometry {
    LINES = [
      [0, 1],
      [1, 3],
      [3, 2],
      [2, 0],
      [2, 6],
      [3, 7],
      [0, 4],
      [1, 5],
      [6, 7],
      [6, 4],
      [7, 5],
      [4, 5]
    ]

    VERTICES = [
      [-1, -1, -1],
      [1, -1, -1],
      [-1, 1, -1],
      [1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [-1, 1, 1],
      [1, 1, 1]
    ]

    constructor(x: number, y: number, z: number) {
      super()
      this.scale.set(x, y, z)
    }

    // Do some math to project the 3D position into the 2D canvas
    project(x: number, y: number, z: number) {
      const pv = v
        .set(x, y, z)
        .applyMatrix4(inverseProjectionMatrix)
        .applyMatrix4(projectionMatrix)
        .applyMatrix4(camMatrix)

      return {
        x: pv.x,
        y: pv.y
      }
    }

    applyMatrix4(x: number, y: number, z: number) {
      const e = this.matrix.elements

      const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15])

      const tx = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w
      const ty = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w
      const tz = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w

      return {
        x: tx,
        y: ty,
        z: tz
      }
    }

    draw() {
      this.updateMatrix()

      for (let i = 0; i < this.LINES.length; i++) {
        const transformedV1Cube = this.applyMatrix4(
          this.VERTICES[this.LINES[i][0]][0],
          this.VERTICES[this.LINES[i][0]][1],
          this.VERTICES[this.LINES[i][0]][2]
        )
        const transformedV2Cube = this.applyMatrix4(
          this.VERTICES[this.LINES[i][1]][0],
          this.VERTICES[this.LINES[i][1]][1],
          this.VERTICES[this.LINES[i][1]][2]
        )

        const v1 = {
          x: this.position.x + transformedV1Cube.x,
          y: this.position.y + transformedV1Cube.y,
          z: this.position.z + transformedV1Cube.z
        }
        const v2 = {
          x: this.position.x + transformedV2Cube.x,
          y: this.position.y + transformedV2Cube.y,
          z: this.position.z + transformedV2Cube.z
        }

        const v1Project = this.project(v1.x, v1.y, v1.z)
        const v2Project = this.project(v2.x, v2.y, v2.z)

        if (!ctx) return
        ctx.beginPath()
        ctx.moveTo(v1Project.x, v1Project.y)
        ctx.lineTo(v2Project.x, v2Project.y)
        ctx.strokeStyle = '#fff'
        ctx.stroke()
      }
    }
  }

  /* ====================== */
  /* ======== RENDER ====== */
  /* ====================== */
  let elapsedTime = 0
  let lastTime = new Date().getTime()

  function render() {
    // Calculate deltatime to update animation
    const currentTime = new Date().getTime()
    const deltaTime = currentTime - lastTime
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    elapsedTime += deltaTime / 1000
    lastTime = currentTime

    // Clear the scene
    ctx?.clearRect(0, 0, width, height)

    /* Update global matrix */
    globalMatrix.compose(globalPosition, globalRotation, v.set(1, 1, 1))

    // Loop through the dots array and draw every dot
    for (let i = 0; i < geometries.length; i++) {
      geometries?.[i].draw()
    }
  }

  // Function called after the user resized its screen
  function afterResize() {
    width = canvas.offsetWidth
    height = canvas.offsetHeight
    if (window.devicePixelRatio > 1) {
      canvas.width = canvas.clientWidth * 2
      canvas.height = canvas.clientHeight * 2
      ctx?.scale(2, 2)
    } else {
      canvas.width = width
      canvas.height = height
    }
  }

  // Variable used to store a timeout when user resized its screen
  let resizeTimeout: number | undefined

  // Function called right after user resized its screen
  function onResize() {
    // Clear the timeout variable
    window.clearTimeout(resizeTimeout)
    // Store a new timeout to avoid calling afterResize for every resize event
    resizeTimeout = window.setTimeout(afterResize, 500)
  }

  window.addEventListener('resize', onResize)

  /* Create the cubes */
  const baseScale = 32
  const thickness = 0.7
  const length = 5.5
  const c1 = new Cube(
    length * baseScale,
    thickness * baseScale,
    thickness * baseScale
  )
  c1.rotation.set(0, 0, 0)
  c1.position.set(200, 0, 0)

  geometries.push(c1)
  const c2 = new Cube(
    length * baseScale,
    thickness * baseScale,
    thickness * baseScale
  )
  c2.rotation.set(0, 0, Math.PI / 2)
  c2.position.set(0, -200, 0)
  geometries.push(c2)

  const c3 = new Cube(
    length * baseScale,
    thickness * baseScale,
    thickness * baseScale
  )
  c3.rotation.set(0, Math.PI / 2, 0)
  c3.position.set(0, 0, -200)
  geometries.push(c3)

  gsap
    .timeline({
      repeat: -1,
      yoyo: false,
      repeatDelay: 2,
      // delay: 2,
      defaults: { duration: 0.77 }
    })
    .fromTo(c2.position, { y: -700 }, { y: 0, ease: easings.inOutCubic }, 0)
    .fromTo(c1.position, { x: 700 }, { x: 0, ease: easings.inOutCubic }, '<')
    .fromTo(c3.position, { z: 700 }, { z: 0, ease: easings.inOutCubic }, '<')
    .fromTo(
      {},
      {},
      {
        delay: 0.1,
        ease: easings.inOutExpo,
        duration: 1,
        onUpdate() {
          globalRotation.setFromEuler(e.set(0, Math.PI * 2 * this.ratio, 0))
        }
      }
    )
    .fromTo(
      c2.position,
      { y: 0 },
      { y: -700, duration: 0.525, ease: easings.inCubic }
    )
    .fromTo(
      c1.position,
      { x: 0 },
      { x: 700, duration: 0.525, ease: easings.inCubic },
      '<'
    )
    .fromTo(
      c3.position,
      { z: 0 },
      { z: 700, duration: 0.525, ease: easings.inCubic },
      '<'
    )

  gsap.ticker.add(render)

  /* Cleanup */
  return () => {
    gsap.ticker.remove(render)
  }
}

const TransitionAnimation01 = () => {
  return <Script fn={main} />
}

TransitionAnimation01.Layout = PlainCanvasLayout
TransitionAnimation01.Title = 'Transition Animation 01'

export default TransitionAnimation01
