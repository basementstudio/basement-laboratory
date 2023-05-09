import { useControls } from 'leva'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { Script } from '../components/common/script'
import { PlainCanvasLayout } from '../components/layout/plain-canvas-layout.tsx'
import { isClient } from '../lib/constants'
import { createWorld } from '../lib/three'

let canvasHelper
let ctx

if (isClient) {
  canvasHelper = document.createElement('canvas')
  ctx = canvasHelper.getContext('2d')
}

const PlainThreejs = (CONFIG) => {
  let loaded = false
  const canvas = document.querySelector('#webgl')

  const { destroy, update, camera, scene, clock, raycaster, cursor } =
    createWorld({
      rendererConfig: {
        canvas,
        antialias: true
      },
      withRaycaster: true
    })

  /* Wing material */
  const createWingMaterial = (alphaTexture) =>
    new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uAlpha: { value: 0 },
        uColor: { value: new THREE.Color('white') },
        uTime: { value: clock.elapsedTime },
        uAlphaTexture: { value: alphaTexture },
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
          varying float vNormalizedMinMaxHeightRange;
          varying vec3 vNormal;
    
          void main() {
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            
            // From 0 to 1 from the root of the wing to the end
            float normalizedXPos = (position.x - float(uMinMaxX.x)) / (float(uMinMaxX.y) - float(uMinMaxX.x));
    
            float movement = sin(-position.x * float(${CONFIG.frequency}) + uTime * float(${CONFIG.speed}));
    

            float transformedNormalizedXPos = normalizedXPos * float(${CONFIG.intensity});
            // This movement decreases its intensity towards the root of the wing
            float transformedMovement = movement * transformedNormalizedXPos;

            // Used to calc x position, we care about negative values
            float normalizedMinMaxHeightFullRange = (transformedMovement - (-transformedNormalizedXPos)) / (transformedNormalizedXPos - (-transformedNormalizedXPos));

            modelPosition.z += transformedMovement;
            modelPosition.x += -((modelPosition.x / abs(modelPosition.x)) * float(${CONFIG.intensity}) * abs(transformedMovement));
    
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
    
            gl_Position = projectedPosition;

            vHeight = transformedMovement;
            vUv = uv;
            vNormalizedXPos = transformedNormalizedXPos;
            vNormal = normal;
            // Used to calc color, because we dont use negative values to shade color based on depth
            vNormalizedMinMaxHeightRange = movement;
          }
        `,
      fragmentShader: /* glsl */ `
          uniform float uAlpha;
          uniform vec3 uColor;
          uniform sampler2D uAlphaTexture;

          varying float vHeight;
          varying vec2 vUv;
          varying float vNormalizedXPos;
          varying float vNormalizedMinMaxHeightRange;
          varying mediump vec3 vNormal;

          void main() {
            vec3 normal = vNormal;

            vec4 alphaTexture = texture2D(uAlphaTexture, vUv);

            float invertedAlphaColor = 1.0 - alphaTexture.g;
            float alpha = invertedAlphaColor * uAlpha;

            float darkeningMultiplier = 0.75;
            float depthDarkening = vNormalizedMinMaxHeightRange * darkeningMultiplier * ((1.0 - vNormalizedXPos) - 0.28);

            gl_FragColor = vec4(uColor - clamp(depthDarkening, 0.0, 1.0), alpha);
          }
        `,
      transparent: true,
      depthTest: false,
      wireframe: CONFIG.wireframe
    })

  // Load texture
  const loadingManager = new THREE.LoadingManager(() => {
    loaded = true

    const image = wing1.image

    if (isClient) {
      canvasHelper.width = image.width
      canvasHelper.height = image.height

      ctx.drawImage(image, 0, 0)
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/ImageData/data
    // const imgData = ctx.getImageData(0, 0, image.width, image.height)
  })
  const textureLoader = new THREE.TextureLoader(loadingManager)
  const wing1 = textureLoader.load('/textures/14.wing-1.png')
  const wing2 = textureLoader.load('/textures/14.wing-2.png')

  /* Controls */
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  // controls.enableRotate = false
  controls.update()

  /* Object */
  const geometry = new THREE.PlaneGeometry(1, 1, 50, 50)

  const count = geometry.attributes.position.count

  const upWingMaterial = createWingMaterial(wing1)
  const downWingMaterial = createWingMaterial(wing2)

  const wingRightUp = new THREE.Mesh(geometry, upWingMaterial)
  const wingLeftUp = new THREE.Mesh(geometry, upWingMaterial.clone())
  const wingRightDown = new THREE.Mesh(geometry, downWingMaterial)
  const wingLeftDown = new THREE.Mesh(geometry, downWingMaterial.clone())

  // Positionate Wings
  wingRightUp.position.set(1 / 2 + 0.025, 0, 0)
  wingLeftUp.position.set(-(1 / 2 + 0.025), 0, 0)
  wingRightDown.position.set(1 / 2 + 0.025, -0.72, -0.0005)
  wingLeftDown.position.set(-(1 / 2 + 0.025), -0.72, -0.0005)

  // Name wings
  wingRightUp.userData.name = 'right-up'
  wingLeftUp.userData.name = 'left-up'
  wingRightDown.userData.name = 'right-down'
  wingLeftDown.userData.name = 'left-down'

  const fly = new THREE.Group().add(
    wingRightUp,
    wingRightDown,
    wingLeftUp,
    wingLeftDown
  )
  fly.position.set(0, 0.2, 0)

  // X invert left wing
  wingLeftUp.rotation.y = Math.PI
  wingLeftDown.rotation.y = Math.PI

  camera.position.set(0, 0, 3.5)

  scene.add(fly)

  let resolvedAlpha = 0
  let defaultColor = new THREE.Color('white')
  let hoverColor = new THREE.Color('red')
  let wingHoverColors = {
    'right-up': '#1676FF',
    'right-down': '#06D6A0',
    'left-up': '#FF0075',
    'left-down': '#FFBE0B'
  }
  let intersection

  update(() => {
    raycaster.setFromCamera(cursor, camera)

    fly.children.forEach((mesh) => {
      mesh.material.uniforms.uColor.value = defaultColor
    })

    intersection = raycaster.intersectObjects(fly.children)[0]

    if (intersection) {
      hoverColor.set(wingHoverColors[intersection.object.userData.name])
      intersection.object.material.uniforms.uColor.value = hoverColor
    }

    controls.update()
    geometry.computeVertexNormals()

    upWingMaterial.uniforms.uTime.value = clock.elapsedTime
    downWingMaterial.uniforms.uTime.value = clock.elapsedTime - 0.1

    resolvedAlpha = loaded ? 1 : 0
    fly.children.forEach((obj, i) => {
      if (i % 2 === 0) {
        obj.material.uniforms.uTime.value = clock.elapsedTime
      } else {
        obj.material.uniforms.uTime.value = clock.elapsedTime - 0.1
      }

      obj.material.uniforms.uAlpha.value = resolvedAlpha
    })
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
      value: 0.7,
      max: 10.0
    },
    intensity: {
      min: 0,
      step: 0.05,
      value: 0.5,
      max: 2
    },
    wireframe: {
      value: false
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
PlainThreejs.Tags = 'shader,threejs,private'

export default PlainThreejs
