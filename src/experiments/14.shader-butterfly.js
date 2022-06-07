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
  const geometry = new THREE.PlaneBufferGeometry(1, 1, 50, 50)

  const count = geometry.attributes.position.count

  const upWingMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color('white') },
      uTime: { value: clock.elapsedTime },
      uAlphaTexture: { value: wing1 },
      uMinMaxX: {
        value: [
          geometry.attributes.position.array[0],
          geometry.attributes.position.array[(count - 1) * 3]
        ]
      }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec2 uMinMaxX;
      uniform mat3 positions;

      varying float vHeight;
      varying vec2 vUv;
      varying float vNormalizedXPos;
		  varying vec3 vNormal; 

      void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);

        float normalizedXPos = (position.x - float(uMinMaxX.x)) / (float(uMinMaxX.y) - float(uMinMaxX.x));

        float movement = sin(-position.x * float(${CONFIG.frequency}) + uTime * float(${CONFIG.speed}));

        float transformedMovement = movement * float(${CONFIG.intensity}) * normalizedXPos;

        modelPosition.z += transformedMovement;

        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;

        gl_Position = projectedPosition;

        vHeight = movement;
        vUv = uv;
        vNormalizedXPos = normalizedXPos;
        vNormal = normal;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform sampler2D uAlphaTexture;

      varying float vHeight;
      varying vec2 vUv;
      varying float vNormalizedXPos;
      varying mediump vec3 vNormal;

      void main() {
        vec4 alphaTexture = texture2D(uAlphaTexture, vUv);

        mediump vec3 light = vec3(0.5, 0.2, 1.0);
        light = normalize(light);

        mediump float dProd = max(0.0, dot(vNormal, light));
 
        vec3 invertedColor = vec3(1.0, 1.0, 1.0) - alphaTexture.rgb;
        float alpha = (invertedColor.r + invertedColor.g + invertedColor.b / 3.0);

        gl_FragColor = vec4(dProd, dProd, dProd, alpha);
      } 
    `,
    transparent: true,
    depthTest: false
  })

  const downWingMaterial = upWingMaterial.clone()
  downWingMaterial.uniforms.uAlphaTexture.value = wing2

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
    geometry.computeVertexNormals()
    upWingMaterial.uniforms.uTime.value = clock.elapsedTime
    downWingMaterial.uniforms.uTime.value = clock.elapsedTime - 0.1
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
