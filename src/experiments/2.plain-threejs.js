import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { Script } from '../components/common/script'
import { PlainCanvasLayout } from '../components/layout/plain-canvas-layout.tsx'
import { createWorld } from '../lib/three'

const PlainThreejs = () => {
  const canvas = document.querySelector('#webgl')

  const { destroy, update, camera, scene } = createWorld({
    rendererConfig: {
      canvas,
      antialias: true
    }
  })

  /* Controls */
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.update()

  /* Object */
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshNormalMaterial()
  )

  cube.position.x = 0
  cube.position.y = 0
  cube.position.z = 0

  scene.add(cube)

  update(() => {
    controls.update()
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
  })

  return destroy
}

PlainThreejs.getLayout = ({ Component: fn, ...rest }) => (
  <PlainCanvasLayout {...rest}>
    <Script fn={fn} />
  </PlainCanvasLayout>
)

export const title = 'Plain ThreeJS (example)'
export const description = 'An example of how to do a plain ThreeJS experiment.'
PlainThreejs.Tags = 'example'

export default PlainThreejs
