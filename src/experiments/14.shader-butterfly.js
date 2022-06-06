import { useControls } from 'leva'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { Script } from '../components/common/script'
import { PlainCanvasLayout } from '../components/layout/plain-canvas-layout.tsx'
import { createWorld } from '../lib/three'

const PlainThreejs = (CONFIG) => {
  const canvas = document.querySelector('#webgl')

  const { destroy, update, camera, scene, clock } = createWorld({
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

  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color('red') },
      uTime: { value: clock.elapsedTime }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying float vHeight;

      void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      
        float normalizedXPos = position.x / 1.0;

        modelPosition.z += sin(-position.x * float(${CONFIG.frequency}) + uTime * float(${CONFIG.speed})) * float(${CONFIG.intensity}) * (1.0 + normalizedXPos);

        vHeight = modelPosition.z;

        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;

        gl_Position = projectedPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vHeight;

      void main() {
        gl_FragColor = vec4(uColor, 1.0);
      } 
    `,
    wireframe: true
  })
  const geometry = new THREE.PlaneBufferGeometry(1, 1, 50, 50)

  const wingRightUp = new THREE.Mesh(geometry, material)
  const wingLeftUp = new THREE.Mesh(geometry, material)
  const wingRightDown = new THREE.Mesh(geometry, material)
  const wingLeftDown = new THREE.Mesh(geometry, material)

  wingRightUp.position.set(1 / 2 + 0.01, 0, 0)
  wingLeftUp.position.set(-(1 / 2 + 0.01), 0, 0)
  wingRightDown.position.set(1 / 2 + 0.01, -1.02, 0)
  wingLeftDown.position.set(-(1 / 2 + 0.01), -1.02, 0)

  const fly = new THREE.Group().add(
    wingRightUp,
    wingLeftUp,
    wingRightDown,
    wingLeftDown
  )
  fly.position.set(0, 0.5, 0)

  wingLeftUp.rotation.z = Math.PI
  wingLeftDown.rotation.z = Math.PI

  camera.position.set(0, 0, 3.5)

  scene.add(fly)
  // scene.add(cube)

  update(() => {
    controls.update()
    material.uniforms.uTime.value = clock.elapsedTime
  })

  return () => {
    controls.dispose()
    destroy()
  }
}

const Controls = ({ children }) => {
  const config = useControls({
    speed: {
      min: 0,
      step: 0.1,
      value: 3.2,
      max: 10
    },
    frequency: {
      min: 0,
      step: 0.1,
      value: 1.8,
      max: 10.0
    },
    intensity: {
      min: 0,
      step: 0.05,
      value: 0.35,
      max: 2
    }
  })
  return <>{children(config)}</>
}

PlainThreejs.getLayout = ({ Component: fn, ...rest }) => (
  <PlainCanvasLayout {...rest}>
    <Controls>{(config) => <Script fn={() => fn(config)} />}</Controls>
  </PlainCanvasLayout>
)

PlainThreejs.Title = 'Shader Butterfly (in progress)'

export default PlainThreejs
