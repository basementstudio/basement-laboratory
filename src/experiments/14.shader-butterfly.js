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

  // Load texture
  const textureLoader = new THREE.TextureLoader()
  const wing1 = textureLoader.load('/textures/14.wing-1.png')
  const wing2 = textureLoader.load('/textures/14.wing-2.png')

  /* Controls */
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.update()

  /* Object */
  const upWingMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color('red') },
      uTime: { value: clock.elapsedTime },
      uAlphaTexture: { value: wing1 }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      
      varying float vHeight;
      varying vec2 vUv;

      void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      
        float normalizedXPos = position.x / 1.0;

        modelPosition.z += sin(-position.x * float(${CONFIG.frequency}) + uTime * float(${CONFIG.speed})) * float(${CONFIG.intensity}) * (1.0 + normalizedXPos);

        vHeight = modelPosition.z;
        vUv = uv;

        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;

        gl_Position = projectedPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform sampler2D uAlphaTexture;
      
      varying float vHeight;
      varying vec2 vUv;

      void main() {
        vec4 alphaTexture = texture2D(uAlphaTexture, vUv);

        gl_FragColor = vec4(uColor, alphaTexture.a);
      } 
    `,
    wireframe: true,
    transparent: true
  })
  const downWingMaterial = upWingMaterial.clone()
  downWingMaterial.uniforms.uAlphaTexture.value = wing2

  const geometry = new THREE.PlaneBufferGeometry(1, 1, 50, 50)

  const wingRightUp = new THREE.Mesh(geometry, upWingMaterial)
  const wingLeftUp = new THREE.Mesh(geometry, upWingMaterial)
  const wingRightDown = new THREE.Mesh(geometry, downWingMaterial)
  const wingLeftDown = new THREE.Mesh(geometry, downWingMaterial)

  wingRightUp.position.set(1 / 2 + 0.025, 0, 0)
  wingLeftUp.position.set(-(1 / 2 + 0.025), 0, 0)
  wingRightDown.position.set(1 / 2 + 0.025, -0.72, 0)
  wingLeftDown.position.set(-(1 / 2 + 0.025), -0.72, 0)

  wingRightDown.material.uniforms.uAlphaTexture.value = wing2
  wingLeftDown.material.uniforms.uAlphaTexture.value = wing2

  const fly = new THREE.Group().add(
    wingRightUp,
    wingLeftUp,
    wingRightDown,
    wingLeftDown
  )
  fly.position.set(0, 0.2, 0)

  wingLeftUp.rotation.y = Math.PI
  wingLeftDown.rotation.y = Math.PI

  camera.position.set(0, 0, 3.5)

  scene.add(fly)

  update(() => {
    controls.update()
    upWingMaterial.uniforms.uTime.value = clock.elapsedTime
    downWingMaterial.uniforms.uTime.value = clock.elapsedTime
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
