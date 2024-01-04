import { gsap } from 'lib/gsap'
import { Euler, Matrix3, Matrix4, Quaternion, Vector2, Vector3 } from 'three'

import { Script } from '~/components/common/script'
import { PlainCanvasLayout } from '~/components/layout/plain-canvas-layout'

const v3 = new Vector3()

class Object3d {
  matrix: Matrix4
  matrixWorld: Matrix4
  position: Vector3
  rotation: Euler
  scale: Vector3
  quaternion: Quaternion
  parent: World | null

  constructor() {
    this.matrix = new Matrix4()
    this.matrixWorld = new Matrix4()

    this.position = new Vector3()
    this.rotation = new Euler()
    this.scale = new Vector3(1, 1, 1)
    this.quaternion = new Quaternion()
    this.parent = null

    const onRotationChange = () => {
      this.quaternion.setFromEuler(this.rotation, false)
    }

    const onQuaternionChange = () => {
      this.rotation.setFromQuaternion(this.quaternion, undefined, false)
    }

    this.rotation._onChange(onRotationChange)
    this.quaternion._onChange(onQuaternionChange)
  }

  applyMatrix(matrix: Matrix4) {
    this.matrix.multiplyMatrices(matrix, this.matrix)
  }

  updateMatrix() {
    this.matrix.compose(this.position, this.quaternion, this.scale)
  }

  updateMatrixWorld() {
    this.updateMatrix()

    if (this.parent === null) {
      this.matrixWorld.copy(this.matrix)
    } else {
      this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  render(ctx: CanvasRenderingContext2D, camera: FullScreenOrthographicCamera) {}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Object2d {
  matrix: Matrix3
  matrixWorld: Matrix3

  constructor() {
    this.matrix = new Matrix3()
    this.matrixWorld = new Matrix3()
  }
}

class World extends Object3d {
  children: Object3d[]

  constructor() {
    super()
    this.children = []
  }

  add(...objects: Object3d[]) {
    objects.forEach((obj) => {
      if (obj.parent !== null) {
        obj.parent.remove(obj)
      }

      obj.parent = this
      this.children.push(obj)
    })
  }

  updateMatrixWorld() {
    super.updateMatrixWorld()

    for (let i = 0; i < this.children.length; i++) {
      this.children[i].updateMatrixWorld()
    }
  }

  remove(object: Object3d) {
    const index = this.children.indexOf(object)

    if (index !== -1) {
      object.parent = null
      this.children.splice(index, 1)
    }
  }

  traverse(callback: (object: Object3d) => void) {
    for (let i = 0; i < this.children.length; i++) {
      callback(this.children[i])
    }
  }
}

class Line extends Object3d {
  vertices: Vector3[]
  lines: Vector2[]
  color: string

  constructor(from: Vector3, to: Vector3) {
    super()

    this.vertices = [from, to]
    this.lines = [new Vector2(0, 1)]
    this.color = '#fff'
  }

  override render(
    ctx: CanvasRenderingContext2D,
    camera: FullScreenOrthographicCamera
  ) {
    const vertices = this.vertices
    const lines = this.lines

    ctx.beginPath()

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      v3.copy(vertices[line.x])
        .applyMatrix4(this.matrix)
        .applyMatrix4(this.matrixWorld)
        .applyMatrix4(camera.inverseProjectionMatrix)
        .applyMatrix4(camera.projectionMatrix)

      ctx.moveTo(v3.x, v3.y)

      v3.copy(vertices[line.y])
        .applyMatrix4(this.matrix)
        .applyMatrix4(this.matrixWorld)
        .applyMatrix4(camera.inverseProjectionMatrix)
        .applyMatrix4(camera.projectionMatrix)

      ctx.lineTo(v3.x, v3.y)
      ctx.strokeStyle = this.color

      ctx.stroke()
    }

    ctx.closePath()
  }
}

class Cube extends Object3d {
  vertices: Vector3[]
  lines: Vector2[]

  constructor(size = 100) {
    super()

    this.vertices = [
      new Vector3(-1, -1, -1),
      new Vector3(1, -1, -1),
      new Vector3(-1, 1, -1),
      new Vector3(1, 1, -1),
      new Vector3(-1, -1, 1),
      new Vector3(1, -1, 1),
      new Vector3(-1, 1, 1),
      new Vector3(1, 1, 1)
    ].map((v) => v.multiplyScalar(size))

    this.lines = [
      new Vector2(0, 1),
      new Vector2(1, 3),
      new Vector2(3, 2),
      new Vector2(2, 0),
      new Vector2(2, 6),
      new Vector2(3, 7),
      new Vector2(0, 4),
      new Vector2(1, 5),
      new Vector2(6, 7),
      new Vector2(6, 4),
      new Vector2(7, 5),
      new Vector2(4, 5)
    ]
  }

  override render(
    ctx: CanvasRenderingContext2D,
    camera: FullScreenOrthographicCamera
  ) {
    const vertices = this.vertices
    const lines = this.lines

    ctx.beginPath()

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      v3.copy(vertices[line.x])
        .applyMatrix4(this.matrix)
        .applyMatrix4(this.matrixWorld)
        .applyMatrix4(camera.inverseProjectionMatrix)
        .applyMatrix4(camera.projectionMatrix)

      ctx.moveTo(v3.x, v3.y)

      v3.copy(vertices[line.y])
        .applyMatrix4(this.matrix)
        .applyMatrix4(this.matrixWorld)
        .applyMatrix4(camera.inverseProjectionMatrix)
        .applyMatrix4(camera.projectionMatrix)

      ctx.lineTo(v3.x, v3.y)
      ctx.strokeStyle = '#fff'

      ctx.stroke()
    }

    ctx.closePath()
  }
}

class Canvas {
  element: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  dpr: number

  constructor(canvas: HTMLCanvasElement) {
    this.element = canvas
    this.ctx = canvas.getContext('2d')!
    this.dpr = window.devicePixelRatio

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    if (this.dpr > 1) {
      canvas.width = canvas.clientWidth * this.dpr
      canvas.height = canvas.clientHeight * this.dpr
      this.ctx.scale(this.dpr, this.dpr)

      /* Translate to center */
      this.ctx.translate(
        canvas.width / (2 * this.dpr),
        canvas.height / (2 * this.dpr)
      )
    }
  }

  render(world: World, camera: FullScreenOrthographicCamera) {
    world.updateMatrixWorld()

    this.ctx.clearRect(
      -this.element.width / (2 * this.dpr),
      -this.element.height / (2 * this.dpr),
      this.element.width * this.dpr,
      this.element.height * this.dpr
    )

    this.ctx.fillStyle = '#fff'
    this.ctx.strokeStyle = '#fff'

    world.traverse((object) => {
      this.ctx.save()
      object.render(this.ctx, camera)
      this.ctx.restore()
    })
  }
}

class FullScreenOrthographicCamera extends Object3d {
  projectionMatrix: Matrix4
  inverseProjectionMatrix: Matrix4

  constructor() {
    super()

    this.projectionMatrix = new Matrix4()
    this.inverseProjectionMatrix = new Matrix4()
  }

  updateProjectionMatrix(canvas: Canvas) {
    const canvasElm = canvas.element
    const left = -canvasElm.width / 2
    const right = canvasElm.width / 2
    const top = canvasElm.height / 2
    const bottom = -canvasElm.height / 2
    const near = 0.1
    const far = 1000

    this.projectionMatrix.makeOrthographic(
      left,
      right,
      top,
      bottom,
      near,
      far,
      2000
    )
    this.inverseProjectionMatrix.copy(this.projectionMatrix).invert()
  }
}

const main = () => {
  const canvasElm = document.querySelector<HTMLCanvasElement>('#canvas')

  if (!canvasElm) return

  const canvas = new Canvas(canvasElm)

  const world = new World()
  const camera = new FullScreenOrthographicCamera()

  camera.updateProjectionMatrix(canvas)

  const cube = new Cube()
  cube.position.set(0, 0, 0)
  world.add(cube)

  /* World axes lines */
  const axesSize = 200
  const x = new Line(new Vector3(-axesSize, 0, 0), new Vector3(axesSize, 0, 0))
  x.color = '#f00'
  const y = new Line(new Vector3(0, -axesSize, 0), new Vector3(0, axesSize, 0))
  y.color = '#0f0'
  const z = new Line(new Vector3(0, 0, -axesSize), new Vector3(0, 0, axesSize))
  z.color = '#00f'

  world.add(x, y, z)

  const render = () => {
    canvas.render(world, camera)
    // cube.rotation.x += 0.01
    // cube.rotation.z += 0.01
    // cube.scale.x = 1 + Math.sin(Date.now() * 0.001) * 0.5
    world.rotation.y += 0.01
    world.rotation.x = Math.sin(Date.now() * 0.001) * (Math.PI / 6)
  }

  gsap.ticker.add(render)

  return () => {
    gsap.ticker.remove(render)
  }
}

const Canvas3dOn2dRenderer = () => {
  return <Script fn={main} />
}

Canvas3dOn2dRenderer.Layout = PlainCanvasLayout
Canvas3dOn2dRenderer.Title = '3d on 2d canvas renderer'

export default Canvas3dOn2dRenderer
