import {
  OrbitControls,
  useFBO,
  useGLTF,
  // useHelper,
  // useTexture
} from '@react-three/drei'
import { useFrame, /* useLoader, */ useThree } from '@react-three/fiber'
import { folder, useControls } from 'leva'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

// eslint-disable-next-line prettier/prettier
const vertexShader =/* glsl */  `
varying vec3 worldNormal;
varying vec3 eyeVector;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vec4 mvPosition = viewMatrix * worldPos;

  gl_Position = projectionMatrix * mvPosition;

  vec3 transformedNormal = normalMatrix * normal;
  worldNormal = normalize(transformedNormal);

  eyeVector = normalize(worldPos.xyz - cameraPosition);
  vUv = uv;
  vNormal = normal;
}
`

// eslint-disable-next-line prettier/prettier
const fragmentShader =/* glsl */ `
uniform float uIorR;
uniform float uIorG;
uniform float uIorB;
uniform float uChromaticAberration;
uniform float uRefractPower;
uniform vec2 winResolution;
uniform sampler2D uTexture;
uniform sampler2D uDirtMap;
uniform bool uRefractiveVisible;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 worldNormal;
varying vec3 eyeVector;

const int LOOP = 16;

vec4 blend (vec4 base, vec4 blend) {
  return vec4(base.rgb * (1.0 - blend.a) + blend.rgb * blend.a, base.a);
}

vec3 calcIrradiance(vec3 nor) {
  vec3 irradiance = vec3(
    nor.y,
    sin(nor.z),
    nor.y * nor.y
  );

  return irradiance;
}

void main() {
  float iorRatioRed = 1.0/uIorR;
  float iorRatioGreen = 1.0/uIorG;
  float iorRatioBlue = 1.0/uIorB;

  vec2 screenMappedUv = gl_FragCoord.xy / winResolution.xy;
  vec3 normal = worldNormal;
  vec3 color = vec3(0.0);

  for ( int i = 0; i < LOOP; i ++ ) {
    float slide = float(i) / float(LOOP) * 0.1;

    vec3 refractVecR = refract(eyeVector, normal, iorRatioRed);
    vec3 refractVecG = refract(eyeVector, normal, iorRatioGreen);
    vec3 refractVecB = refract(eyeVector, normal, iorRatioBlue);
    
    color.r += 
      texture2D(uTexture, screenMappedUv + refractVecR.xy * (uRefractPower + slide * 1.0) * uChromaticAberration).r;
    color.g += 
      texture2D(uTexture, screenMappedUv + refractVecG.xy * (uRefractPower + slide * 2.0) * uChromaticAberration).g;
    color.b += 
      texture2D(uTexture, screenMappedUv + refractVecB.xy * (uRefractPower + slide * 3.0) * uChromaticAberration).b;
  }

  // Divide by the number of layers to normalize colors (rgb values can be worth up to the value of LOOP)
  color.rgb /= float( LOOP );

  vec4 overlayTexture = texture2D(uDirtMap, vUv);
  vec4 invertedOverlayTexture = vec4(vec3(1.0) - overlayTexture.rgb, overlayTexture.a);


  /* Border */
  float zFacingProduct = dot(vNormal, vec3(0.0, 0.0, 1.0));
  float borderChromaFactor = smoothstep(-0.999, 0.0, zFacingProduct) - smoothstep(0.0, 0.999, zFacingProduct);

  if(uRefractiveVisible) {
    gl_FragColor.a = 1.0;
  } else {
    gl_FragColor.a = borderChromaFactor;
  }

  gl_FragColor.rgb = blend(
    vec4(color, 1.0),
    vec4(invertedOverlayTexture.rgb, invertedOverlayTexture.a * step(0.58, invertedOverlayTexture.r))
  ).rgb;

  // gl_FragColor.rgb = blend(
  //   gl_FragColor,
  //   borderChromaFactor * vec4(calcIrradiance(normal), 1.0)
  // ).rgb;
}
`

const Refraction = () => {
  const viewport = useThree((state) => state.viewport)
  // This reference gives us direct access to our mesh
  const mesh1 = useRef()
  // const mesh2 = useRef()
  const debugPlane = useRef()
  const backgroundGroup = useRef()
  const { nodes, materials } = useGLTF('/models/lente.glb')

  // This is our main render target where we'll render and store the scene as a texture
  const renderTarget1 = useFBO(1024 * viewport.aspect, 1024)
  // const renderTarget2 = useFBO()

  // useHelper(mesh1, VertexNormalsHelper, 0.25, 'green')

  const { iorR, iorG, iorB, chromaticAberration, refraction } = useControls({
    ior: folder({
      iorR: { min: 1.0, max: 2.333, step: 0.001, value: 1.15 },
      iorG: { min: 1.0, max: 2.333, step: 0.001, value: 1.18 },
      iorB: { min: 1.0, max: 2.333, step: 0.001, value: 1.22 }
    }),
    chromaticAberration: {
      value: 0.5,
      min: 0,
      max: 1.5,
      step: 0.01
    },
    refraction: {
      value: 0.01,
      min: 0,
      max: 1,
      step: 0.01
    }
  })

  const uniforms1 = useMemo(
    () => ({
      uRefractiveVisible: {
        value: false
      },
      uDirtMap: {
        value: materials.DefaultMaterial.map
      },
      uTexture: {
        value: null
      },
      uIorR: {
        value: 1.0
      },
      uIorG: {
        value: 1.0
      },
      uIorB: {
        value: 1.0
      },
      uRefractPower: {
        value: 0.2
      },
      uChromaticAberration: {
        value: 1.0
      },
      winResolution: {
        value: new THREE.Vector2(
          window.innerWidth,
          window.innerHeight
        ).multiplyScalar(Math.min(window.devicePixelRatio, 2)) // if DPR is 3 the shader glitches 🤷‍♂️
      }
    }),
    []
  )

  // const uniforms2 = useMemo(
  //   () => ({
  //     uRefractiveVisible: {
  //       value: false
  //     },
  //     uDirtMap: {
  //       value: materials.DefaultMaterial.map
  //     },
  //     uTexture: {
  //       value: null
  //     },
  //     uIorR: {
  //       value: 1.0
  //     },
  //     uIorG: {
  //       value: 1.0
  //     },
  //     uIorB: {
  //       value: 1.0
  //     },
  //     uRefractPower: {
  //       value: 0.2
  //     },
  //     uChromaticAberration: {
  //       value: 1.0
  //     },
  //     winResolution: {
  //       value: new THREE.Vector2(
  //         window.innerWidth,
  //         window.innerHeight
  //       ).multiplyScalar(Math.min(window.devicePixelRatio, 2)) // if DPR is 3 the shader glitches 🤷‍♂️
  //     }
  //   }),
  //   []
  // )

  useFrame((state) => {
    const { gl, scene, camera } = state

    mesh1.current.material.side = THREE.BackSide
    mesh1.current.material.uniforms.uRefractiveVisible.value = false
    mesh1.current.material.uniforms.uTexture.value = null
    // mesh2.current.material.uniforms.uRefractiveVisible.value = false

    gl.setRenderTarget(renderTarget1)
    gl.render(scene, camera)

    mesh1.current.material.side = THREE.FrontSide
    mesh1.current.material.uniforms.uTexture.value = renderTarget1.texture
    mesh1.current.material.uniforms.uRefractiveVisible.value = true

    // gl.setRenderTarget(renderTarget2)
    // gl.render(scene, camera)

    // mesh2.current.material.uniforms.uTexture.value = renderTarget2.texture
    // mesh2.current.material.uniforms.uRefractiveVisible.value = true

    gl.setRenderTarget(null)

    /* Upd mesh 1 */
    mesh1.current.material.uniforms.uIorR.value = iorR
    mesh1.current.material.uniforms.uIorG.value = iorG
    mesh1.current.material.uniforms.uIorB.value = iorB
    mesh1.current.material.uniforms.uChromaticAberration.value =
      chromaticAberration
    mesh1.current.material.uniforms.uRefractPower.value = refraction

    /* Upd mesh 2 */
    // mesh2.current.material.uniforms.uIorR.value = iorR
    // mesh2.current.material.uniforms.uIorG.value = iorG
    // mesh2.current.material.uniforms.uIorB.value = iorB
    // mesh2.current.material.uniforms.uChromaticAberration.value =
    //   chromaticAberration
    // mesh2.current.material.uniforms.uRefractPower.value = refraction

    /* Debug */
    // debugPlane.current.material.map = renderTarget1.texture

    /* Rotate on mouse move */
    const { x, y } = state.mouse
    mesh1.current.rotation.x = y * 0.3
    mesh1.current.rotation.y = x * 0.3
  })

  return (
    <>
      {/* <axesHelper />
      <gridHelper /> */}
      <color attach="background" args={['#000']} />
      <OrbitControls />
      <group ref={backgroundGroup}>
        <mesh position={[-4, -3, -4]}>
          <icosahedronGeometry args={[2, 16]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[4, -3, -4]}>
          <icosahedronGeometry args={[2, 16]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[-5, 3, -4]}>
          <icosahedronGeometry args={[2, 16]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[5, 3, -4]}>
          <icosahedronGeometry args={[2, 16]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </group>
      <mesh
        // scale={[2.5, 2.5, 1.8]}
        geometry={nodes.Cylinder001_1.geometry}
        position={[0, 0, -1]}
        ref={mesh1}
      >
        <shaderMaterial
          key={'1-a'}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms1}
          transparent
        />
      </mesh>
      {/* <mesh
        scale={2.5}
        geometry={nodes.Cylinder001_1.geometry}
        position={[0, 0, 0]}
        ref={mesh2}
      >
        <shaderMaterial
          key={'1-b'}
          vertexShader={vertexShader}
          side={THREE.DoubleSide}
          fragmentShader={fragmentShader}
          uniforms={uniforms2}
          transparent
        />
      </mesh> */}

      {/* A plane with the size of the screern */}
      <mesh position={[-10, 5, 0]} ref={debugPlane}>
        <planeGeometry args={[3 * viewport.aspect, 3, 1]} />
        <meshBasicMaterial />
      </mesh>
    </>
  )
}

Refraction.Title = 'Refraction'
Refraction.Description = (
  <>
    Refraction shader inspired{' '}
    <a
      href="https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/"
      target="_blank"
      rel="noopener"
    >
      in this blog
    </a>
  </>
)

export default Refraction
