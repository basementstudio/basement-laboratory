import { gsap } from 'lib/gsap'
import { Matrix4 } from 'three/src/math/Matrix4'

import { Script } from '~/components/common/script'
import { PlainCanvasLayout } from '~/components/layout/plain-canvas-layout'

interface Geometry {
  draw: () => void
  mat: Matrix4
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
  let FIELD_OF_VIEW = width * 0.8
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

  class Cube implements Geometry {
    x: number
    y: number
    z: number
    radius: number
    mat: Matrix4

    constructor() {
      this.x = (Math.random() - 0.5) * width
      this.y = (Math.random() - 0.5) * width
      this.z = (Math.random() - 0.5) * width
      this.radius = Math.floor(Math.random() * 12 + 10)

      this.mat = new Matrix4()
      this.mat.makeRotationX(0.2)

      gsap.to(this, {
        x: (Math.random() - 0.5) * (width * 0.5),
        y: (Math.random() - 0.5) * (width * 0.5),
        z: (Math.random() - 0.5) * width,
        repeat: -1,
        yoyo: true,
        duration: Math.random() * 20 + 15,
        ease: 'power2.out'
      })
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
      const tx =
        x * this.mat.elements[0] +
        y * this.mat.elements[1] +
        z * this.mat.elements[2] +
        this.mat.elements[3]
      const ty =
        x * this.mat.elements[4] +
        y * this.mat.elements[5] +
        z * this.mat.elements[6] +
        this.mat.elements[7]
      const tz =
        x * this.mat.elements[8] +
        y * this.mat.elements[9] +
        z * this.mat.elements[10] +
        this.mat.elements[11]

      return {
        x: tx,
        y: ty,
        z: tz
      }
    }

    // Draw the dot on the canvas
    draw() {
      // Do not render a cube that is in front of the camera
      if (this.z < -FIELD_OF_VIEW + this.radius) {
        return
      }
      for (let i = 0; i < CUBE_LINES.length; i++) {
        const v1 = {
          x: this.x + this.radius * CUBE_VERTICES[CUBE_LINES[i][0]][0],
          y: this.y + this.radius * CUBE_VERTICES[CUBE_LINES[i][0]][1],
          z: this.z + this.radius * CUBE_VERTICES[CUBE_LINES[i][0]][2]
        }
        const v2 = {
          x: this.x + this.radius * CUBE_VERTICES[CUBE_LINES[i][1]][0],
          y: this.y + this.radius * CUBE_VERTICES[CUBE_LINES[i][1]][1],
          z: this.z + this.radius * CUBE_VERTICES[CUBE_LINES[i][1]][2]
        }

        /* Apply matrix transformation for rotating vertices */
        const transformedV1 = this.applyMatrix4(v1.x, v1.y, v1.z)
        const transformedV2 = this.applyMatrix4(v2.x, v2.y, v2.z)

        const v1Project = this.project(
          transformedV1.x,
          transformedV1.y,
          transformedV1.z
        )
        const v2Project = this.project(
          transformedV2.x,
          transformedV2.y,
          transformedV2.z
        )

        if (!ctx) return
        ctx.beginPath()
        ctx.moveTo(v1Project.x, v1Project.y)
        ctx.lineTo(v2Project.x, v2Project.y)
        ctx.strokeStyle = '#fff'
        ctx.stroke()
      }
    }
  }

  function createDots() {
    // Empty the array of dots
    geometries.length = 0

    // Create a new dot based on the amount needed
    for (let i = 0; i < 100; i++) {
      geometries.push(new Cube())
    }
  }

  /* ====================== */
  /* ======== RENDER ====== */
  /* ====================== */
  let renderId: number
  let elapsedTime = 0
  let lastTime = new Date().getTime()

  function render() {
    // Calculate deltatime to update animation
    const currentTime = new Date().getTime()
    const deltaTime = currentTime - lastTime
    elapsedTime += deltaTime / 1000
    lastTime = currentTime

    // Clear the scene
    ctx?.clearRect(0, 0, width, height)

    // Loop through the dots array and draw every dot
    for (let i = 0; i < geometries.length; i++) {
      geometries?.[i].draw()
      geometries?.[i].mat.makeRotationX(elapsedTime)
    }

    renderId = window.requestAnimationFrame(render)
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
    FIELD_OF_VIEW = width * 0.8

    createDots() // Reset all dots
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

  // Populate the dots array with random dots
  createDots()

  // Render the scene
  window.requestAnimationFrame(render)

  /* Cleanup */
  return () => {
    window.cancelAnimationFrame(renderId)
  }
}

const TransitionAnimation01 = () => {
  return <Script fn={main} />
}

TransitionAnimation01.Layout = PlainCanvasLayout
TransitionAnimation01.Title = 'Transition Animation 01'

export default TransitionAnimation01
