import { useControls } from 'leva'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'

import { Script } from '../components/common/script'
import { PlainCanvasLayout } from '../components/layout/plain-canvas-layout.tsx'
import { createWorld } from '../lib/three'
import { range } from '../lib/utils'

const _box = /*@__PURE__*/ new THREE.Box3()

class BoxHelper extends THREE.LineSegments {
  constructor(object, color = 0xffff00) {
    const indices = new Uint16Array([
      0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7
    ])
    const positions = new Float32Array(8 * 3)

    const geometry = new THREE.BufferGeometry()
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    super(
      geometry,
      new THREE.LineBasicMaterial({ color: color, toneMapped: false })
    )

    this.object = object
    this.type = 'BoxHelper'

    this.matrixAutoUpdate = false

    this.update()
  }

  update(object) {
    if (object !== undefined) {
      console.warn('THREE.BoxHelper: .update() has no longer arguments.')
    }

    if (this.object !== undefined) {
      _box.setFromObject(this.object)
    }

    if (_box.isEmpty()) return

    const min = _box.min
    const max = _box.max

    /*
			5____4
		1/___0/|
		| 6__|_7
		2/___3/
		0: max.x, max.y, max.z
		1: min.x, max.y, max.z
		2: min.x, min.y, max.z
		3: max.x, min.y, max.z
		4: max.x, max.y, min.z
		5: min.x, max.y, min.z
		6: min.x, min.y, min.z
		7: max.x, min.y, min.z
		*/

    const position = this.geometry.attributes.position
    const array = position.array

    array[0] = max.x
    array[1] = max.y
    array[2] = max.z
    array[3] = min.x
    array[4] = max.y
    array[5] = max.z
    array[6] = min.x
    array[7] = min.y
    array[8] = max.z
    array[9] = max.x
    array[10] = min.y
    array[11] = max.z
    array[12] = max.x
    array[13] = max.y
    array[14] = min.z
    array[15] = min.x
    array[16] = max.y
    array[17] = min.z
    array[18] = min.x
    array[19] = min.y
    array[20] = min.z
    array[21] = max.x
    array[22] = min.y
    array[23] = min.z

    position.needsUpdate = true

    this.geometry.computeBoundingSphere()
  }

  setFromObject(object) {
    this.object = object
    this.update()

    return this
  }

  copy(source) {
    THREE.LineSegments.prototype.copy.call(this, source)

    this.object = source.object

    return this
  }
}

const createBox = (model) => {
  return new BoxHelper(model, 'green')
}

const createVertices = (box) => {
  const DIVISION = 10

  const posAttr = box.geometry.getAttribute('position')

  const getDivisionSegment = (a, b, division) => {
    const space = a.clone().sub(b)
    const segmentDif = space.clone().divideScalar(division)

    return segmentDif
  }

  const fillSpaceBetweenPoints = (a, b, axis = 'x') => {
    const segmentDif = getDivisionSegment(a, b, DIVISION)
    const ordered = [a, b].sort((a, b) => a[axis] - b[axis])
    const points = [ordered[0]]

    for (let i = 1; i < DIVISION; i++) {
      const p = b.clone().add(segmentDif.clone().multiplyScalar(i))
      points.push(p)
    }

    points.push(ordered[1])

    return points
  }

  const alternateMixArray = (...arr) =>
    arr
      .reduce(
        (r, a) => (a.forEach((a, i) => (r[i] = r[i] || []).push(a)), r),
        []
      )
      .reduce((a, b) => a.concat(b))

  const getVectorFromBuffer = (buffer, idx) => {
    const x = buffer[idx * 3 + 0]
    const y = buffer[idx * 3 + 1]
    const z = buffer[idx * 3 + 2]

    return new THREE.Vector3(x, y, z)
  }

  const points = range(2).map((i) => {
    const i3a = i * 4 + 0
    const i3b = i * 4 + 1
    const i3d = i * 4 + 3

    const pa = getVectorFromBuffer(posAttr.array, i3a)
    const pb = getVectorFromBuffer(posAttr.array, i3b)
    const pd = getVectorFromBuffer(posAttr.array, i3d)

    const mix = []
    const divisionSegment = getDivisionSegment(pa, pd, DIVISION)
    const multiplier = new THREE.Vector3(1, 1, 1)

    for (let i = 0; i < DIVISION + 1; i++) {
      multiplier.y = -i
      const _pa = pa.clone().add(divisionSegment.clone().multiply(multiplier))
      const _pb = pb.clone().add(divisionSegment.clone().multiply(multiplier))

      mix.push(fillSpaceBetweenPoints(_pa, _pb))
    }

    return mix.flat()
  })

  const coords = alternateMixArray(...points)

  const geometry = new THREE.BufferGeometry().setFromPoints(coords)

  return geometry
}

const ModelBox = (config) => {
  const canvas = document.querySelector('#webgl')

  const { scene, update, camera, destroy, renderer } = createWorld({
    rendererConfig: {
      canvas
    }
  })

  /* Controls */
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.update()

  /* Object */
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 'red',
      wireframe: true
    })
  )

  sphere.position.x = 0
  sphere.position.y = 0
  sphere.position.z = 0
  sphere.scale.set(config.modelScale, config.modelScale, config.modelScale)

  const boxHelper = createBox(sphere)
  const geometry1 = createVertices(boxHelper)
  const geometry2 = geometry1.clone()
  const geometry3 = geometry1.clone()
  geometry2.rotateY(Math.PI / 2)
  geometry3.rotateX(Math.PI / 2)

  /* Add a dummy buffer geometry (has no points) */
  const geometries = [new THREE.BufferGeometry().setFromPoints([])]

  if (config.coordSet1) {
    geometries.push(geometry1)
  }

  if (config.coordSet2) {
    geometries.push(geometry2)
  }

  if (config.coordSet3) {
    geometries.push(geometry3)
  }

  const finalGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries)
  let mesh

  if (config.draw === 'points') {
    mesh = new THREE.Points(
      finalGeometry,
      new THREE.PointsMaterial({ color: 0x0000ff, size: 0.1 })
    )
  } else if (config.draw === 'lines') {
    mesh = new THREE.LineSegments(
      finalGeometry,
      new THREE.LineBasicMaterial({ color: 0x0000ff })
    )
  } else {
    throw new Error('Unknown draw type')
  }

  /* Helpers */
  // const axesHelper = new THREE.AxesHelper(5)
  // const gridHelper = new THREE.GridHelper(10, 10)

  // scene.add(gridHelper)
  // scene.add(axesHelper)

  if (config.showBoxHelper) {
    scene.add(boxHelper)
  }

  scene.add(mesh)
  scene.add(sphere)

  update(() => {
    controls.update()
    boxHelper.update()
  })

  return () => {
    controls.dispose()
    renderer.renderLists.dispose()
    destroy()
  }
}

const Controls = ({ children }) => {
  const config = useControls({
    modelScale: {
      min: 0,
      step: 0.1,
      value: 2,
      max: 10
    },
    showBoxHelper: {
      value: true
    },
    coordSet1: {
      value: true
    },
    coordSet2: {
      value: true
    },
    coordSet3: {
      value: true
    },
    draw: {
      options: ['lines', 'points'],
      value: 'lines'
    }
  })
  return <>{children(config)}</>
}

ModelBox.getLayout = ({ Component: fn, ...rest }) => (
  <PlainCanvasLayout {...rest}>
    <Controls>{(config) => <Script fn={() => fn(config)} />}</Controls>
  </PlainCanvasLayout>
)

ModelBox.Title = 'Particled Model (in progress)'

export default ModelBox
