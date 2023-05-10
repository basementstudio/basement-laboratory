import { useControls } from 'leva'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { Script } from '../components/common/script'
import { PlainCanvasLayout } from '../components/layout/plain-canvas-layout.tsx'
import { createWorld, getViewport, trackCursor } from '../lib/three'

Object.assign(THREE.PlaneGeometry.prototype, {
  toGrid: function () {
    let segmentsX = this.parameters.widthSegments || 1
    let segmentsY = this.parameters.heightSegments || 1
    let indices = []
    for (let i = 0; i < segmentsY + 1; i++) {
      let index11 = 0
      let index12 = 0
      for (let j = 0; j < segmentsX; j++) {
        index11 = (segmentsX + 1) * i + j
        index12 = index11 + 1
        let index21 = index11
        let index22 = index11 + (segmentsX + 1)
        indices.push(index11, index12)
        if (index22 < (segmentsX + 1) * (segmentsY + 1) - 1) {
          indices.push(index21, index22)
        }
      }
      if (index12 + segmentsX + 1 <= (segmentsX + 1) * (segmentsY + 1) - 1) {
        indices.push(index12, index12 + segmentsX + 1)
      }
    }
    this.setIndex(indices)
    return this
  }
})

const GridBump = (CONFIG) => {
  const canvas = document.querySelector('#webgl')

  const viewport = getViewport()
  const { update, destroy, scene, camera, getWorld } = createWorld({
    rendererConfig: {
      canvas,
      antialias: true
    },
    withRaycaster: false
  })

  const cursorTracker = trackCursor()

  // Add orbit controls
  const controls = new OrbitControls(camera, canvas)
  controls.update()

  /* Measure Window */
  const viewportInThree = getWorld.fromViewport({
    width: viewport.size.width,
    height: viewport.size.height
  })

  /* Create raycaster */
  const raycaster = new THREE.Raycaster()

  /* Create plane */
  const geometry = new THREE.PlaneGeometry(
    viewportInThree.width,
    viewportInThree.height,
    Math.round(viewportInThree.width) * CONFIG.divisions,
    Math.round(viewportInThree.height) * CONFIG.divisions
  ).toGrid()

  const targetGrid = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: CONFIG.color,
      size: CONFIG.particleSize
    })
  )

  if (CONFIG.lines) {
    var lines = new THREE.LineSegments(
      geometry,
      new THREE.MeshBasicMaterial({ color: CONFIG.color })
    )

    scene.add(lines)
  }

  if (CONFIG.points) {
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: CONFIG.color,
        size: CONFIG.particleSize
      })
    )
    scene.add(points)
  }

  const vector3 = new THREE.Vector3()

  const elevation = CONFIG.elevation

  update(() => {
    raycaster.setFromCamera(cursorTracker.cursor, camera)

    let found

    if (cursorTracker.hasMoved) {
      const intersections = raycaster.intersectObject(targetGrid)
      found = intersections[0]
    }

    if (found) {
      const mesh = found.object
      const geometry = mesh.geometry
      const point = found.point

      for (let i = 0; i < geometry.attributes.position.count; i++) {
        vector3.setX(geometry.attributes.position.getX(i))
        vector3.setY(geometry.attributes.position.getY(i))
        vector3.setZ(geometry.attributes.position.getZ(i))
        const toWorld = mesh.localToWorld(vector3)

        geometry.attributes.position.setZ(i, 0)

        const distance = point.distanceTo(toWorld)

        if (distance < elevation) {
          geometry.attributes.position.setZ(i, (elevation - distance) / 2)
        }
      }
      geometry.computeVertexNormals()
      geometry.attributes.position.needsUpdate = true
    }
  })

  return () => {
    controls.dispose()
    cursorTracker.destroy()
    viewport.destroy()
    destroy()
  }
}

const Controls = ({ children }) => {
  const config = useControls({
    divisions: {
      min: 1,
      step: 1,
      value: 7,
      max: 100
    },
    particleSize: {
      min: 0,
      step: 0.05,
      value: 0.01,
      max: 10
    },
    elevation: {
      min: 0.1,
      step: 0.1,
      value: 2,
      max: 10
    },
    points: {
      value: true
    },
    lines: {
      value: true
    },
    color: {
      value: '#00ff00'
    }
  })
  return <>{children(config)}</>
}

GridBump.getLayout = ({ Component: fn, ...rest }) => (
  <PlainCanvasLayout {...rest}>
    <Controls>{(config) => <Script fn={() => fn(config)} />}</Controls>
  </PlainCanvasLayout>
)

export const title = 'Grid Bump'
export const tags = ['3d']

export default GridBump
