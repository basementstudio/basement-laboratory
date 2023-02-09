import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { Script } from '../components/common/script'
import { PlainCanvasLayout } from '../components/layout/plain-canvas-layout.tsx'
import { createWorld } from '../lib/three'

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

const fontURL = '/fonts/grotesque/BasementGrotesqueRoman_Bold.json'

const settings = {
  text: 'INCOMPREHENSIBILITY',
  fontSize: 1,
  rotateSpeed: 1,
  twistSpeed: 7.9,
  fontDepth: 0.3,
  radius: 2.8,
  twists: 2,
  visual: 0,
  font: 0
}

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

  camera.position.set(0, 0, 700)

  const fontLoader = new FontLoader()
  const textureLoader = new THREE.TextureLoader()

  const matcapTexture = textureLoader.load('/images/metal_copper_flamed.png')

  fontLoader.load(fontURL, function (font) {
    const geometry = new TextGeometry('basement.', {
      font: font,
      size: 80,
      height: 20,
      curveSegments: 10
    })

    geometry.center()

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 'white',
        wireframe: false,
        map: matcapTexture
      })
    )

    scene.add(mesh)
  })

  update(() => {
    controls.update()
  })

  return destroy
}

PlainThreejs.getLayout = ({ Component: fn, ...rest }) => (
  <PlainCanvasLayout {...rest}>
    <Script fn={fn} />
  </PlainCanvasLayout>
)

PlainThreejs.Title = 'Plain ThreeJS (example)'
PlainThreejs.Description = 'An example of how to do a plain ThreeJS experiment.'
PlainThreejs.Tags = 'example'

export default PlainThreejs
