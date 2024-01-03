import { gsap } from 'lib/gsap'
import { Euler } from 'three/src/math/Euler'
import { Matrix4 } from 'three/src/math/Matrix4'
import { Quaternion } from 'three/src/math/Quaternion'
import { Vector3 } from 'three/src/math/Vector3'

import { Script } from '~/components/common/script'
import { PlainCanvasLayout } from '~/components/layout/plain-canvas-layout'

const globalMatrix = new Matrix4()
const e = new Euler()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const v = new Vector3()

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
  const canvas = document.getElementById('webgl') as HTMLCanvasElement

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

  /* ====================== */
  /* ====== CONSTANTS ===== */
  /* ====================== */
  /* Some of those constants may change if the user resizes their screen but I still strongly believe they belong to the Constants part of the variables */
  let PROJECTION_CENTER_X = width / 2 // X center of the canvas HTML
  let PROJECTION_CENTER_Y = height / 2 // Y center of the canvas HTML
  let FIELD_OF_VIEW = width * 1
  const CUBE_LINES = [
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
  const CUBE_VERTICES = [
    [-1, -1, -1],
    [1, -1, -1],
    [-1, 1, -1],
    [1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [-1, 1, 1],
    [1, 1, 1]
  ]

  class Cube extends Geometry {
    constructor(x: number, y: number, z: number) {
      super()
      this.scale.set(x, y, z)
    }

    // Do some math to project the 3D position into the 2D canvas
    project(x: number, y: number, z: number) {
      const sizeProjection = FIELD_OF_VIEW / (FIELD_OF_VIEW + z)
      const xProject = x * sizeProjection + PROJECTION_CENTER_X
      const yProject = y * sizeProjection + PROJECTION_CENTER_Y
      return {
        size: sizeProjection,
        x: xProject,
        y: yProject
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

    // Draw the dot on the canvas
    draw() {
      this.updateMatrix()

      // Do not render a cube that is in front of the camera
      if (this.position.z < -FIELD_OF_VIEW) {
        return
      }
      for (let i = 0; i < CUBE_LINES.length; i++) {
        const transformedV1Cube = this.applyMatrix4(
          CUBE_VERTICES[CUBE_LINES[i][0]][0],
          CUBE_VERTICES[CUBE_LINES[i][0]][1],
          CUBE_VERTICES[CUBE_LINES[i][0]][2]
        )
        const transformedV2Cube = this.applyMatrix4(
          CUBE_VERTICES[CUBE_LINES[i][1]][0],
          CUBE_VERTICES[CUBE_LINES[i][1]][1],
          CUBE_VERTICES[CUBE_LINES[i][1]][2]
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

    // Loop through the dots array and draw every dot
    for (let i = 0; i < geometries.length; i++) {
      geometries?.[i].draw()
    }

    /* Circular motion on globalMatrix */
    e.set(Math.PI / 10, Math.PI / 4, 0)
    globalMatrix.makeRotationFromEuler(e)
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
    PROJECTION_CENTER_X = width / 2
    PROJECTION_CENTER_Y = height / 2
    FIELD_OF_VIEW = width * 1.5
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

  geometries.push(c1)
  const c2 = new Cube(
    length * baseScale,
    thickness * baseScale,
    thickness * baseScale
  )
  c2.rotation.set(0, 0, Math.PI / 2)
  geometries.push(c2)

  const c3 = new Cube(
    length * baseScale,
    thickness * baseScale,
    thickness * baseScale
  )
  c3.rotation.set(0, Math.PI / 2, 0)
  geometries.push(c3)

  gsap
    .timeline({
      repeat: -1,
      yoyo: false,
      repeatDelay: 2,
      // delay: 2,
      defaults: { duration: 0.77 }
    })
    .fromTo(c2.position, { y: 700 }, { y: 0, ease: easings.inOutCubic }, 0)
    .fromTo(
      c1.position,
      { x: 700 },
      { x: 0, ease: easings.inOutCubic },
      '<+=0.11'
    )
    .fromTo(c3.position, { z: -700 }, { z: 0, ease: easings.inOutCubic }, '<')
    .fromTo(
      {},
      {},
      {
        delay: 0.25,
        ease: easings.inOutExpo,
        duration: 1.2,
        onUpdate() {
          e.set(Math.PI / 10, Math.PI / 4 + Math.PI * 2 * this.ratio, 0)
          globalMatrix.makeRotationFromEuler(e)
        }
      }
    )
    .fromTo(c2.position, { y: 0 }, { y: 700, ease: easings.inOutCubic })
    .fromTo(
      c1.position,
      { x: 0 },
      { x: 700, ease: easings.inOutCubic },
      '<+=0.11'
    )
    .fromTo(c3.position, { z: 0 }, { z: -700, ease: easings.inOutCubic }, '<')

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
