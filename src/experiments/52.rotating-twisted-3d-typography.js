import {
  Environment,
  Instance,
  Instances,
  Lightformer,
  OrbitControls,
  Stats
} from '@react-three/drei'
import { extend, useFrame, useLoader } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
import React, { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'

import { R3FCanvasLayout } from '../components/layout/r3f-canvas-layout'

extend({ TextGeometry })

const Text = ({ config }) => {
  const refMesh = useRef()
  const refMaterial = useRef()
  const font = useLoader(
    FontLoader,
    '/fonts/grotesque/BasementGrotesqueRoman_Bold.json'
  )

  let geo = new TextGeometry(config.text, {
    font,
    size: config.fontSize,
    height: config.fontDepth,
    curveSegments: 100,
    bevelEnabled: false
  })
  geo.center()
  geo.computeBoundingBox()
  let refUniforms = {
    uTime: { value: 0 },
    uTwistSpeed: { value: config.uTwistSpeed },
    uRotateSpeed: { value: config.uRotateSpeed },
    uTwists: { value: config.uTwists },
    uRadius: { value: config.uRadius },
    uMin: { value: { x: 0, y: 0, z: 0 } },
    uMax: { value: { x: 0, y: 0, z: 0 } }
  }

  useEffect(() => {
    if (refMaterial.current.userData.shader) {
      refMaterial.current.userData.shader.uniforms.uRadius.value =
        config.uRadius
      refMaterial.current.userData.shader.uniforms.uTwists.value =
        config.uTwists
      refMaterial.current.userData.shader.uniforms.uTwistSpeed.value =
        config.uTwistSpeed
      refMaterial.current.userData.shader.uniforms.uRotateSpeed.value =
        config.uRotateSpeed
    }
  }, [config])

  useFrame((_, delta) => {
    if (refMaterial.current.userData.shader) {
      refMaterial.current.userData.shader.uniforms.uTime.value += delta
    }
  })

  useLayoutEffect(() => {
    refMesh.current.geometry = geo
    geo.computeBoundingBox()
    let shader = refMaterial.current.userData.shader
    if (shader) {
      shader.uniforms.uMin.value = geo.boundingBox.min
      shader.uniforms.uMax.value = geo.boundingBox.max
      shader.uniforms.uMax.value.x += config.fontSize / 6
    }
    refUniforms.uMin.value = geo.boundingBox.min
    refUniforms.uMax.value = geo.boundingBox.max
    // space after text
    refUniforms.uMax.value.x += config.fontSize / 6
  })

  const onBeforeCompile = (shader) => {
    shader.uniforms = { ...refUniforms, ...shader.uniforms }

    shader.vertexShader =
      `
    uniform float uTwistSpeed;
      uniform float uRotateSpeed;
      uniform float uTwists;
      uniform float uRadius;
      uniform vec3 uMin;
      uniform vec3 uMax;
      uniform float uTime;
      float PI = 3.141592653589793238;
    mat4 rotationMatrix(vec3 axis, float angle) {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;
      
      return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                  oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                  oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                  0.0,                                0.0,                                0.0,                                1.0);
  }
  
  vec3 rotate(vec3 v, vec3 axis, float angle) {
    mat4 m = rotationMatrix(axis, angle);
    return (m * vec4(v, 1.0)).xyz;
  }
  float mapRange(float value, float min1, float max1, float min2, float max2) {
    // return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
    return clamp( min2 + (value - min1) * (max2 - min2) / (max1 - min1), min2, max2 );
  }

    ` + shader.vertexShader

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      '#include <beginnormal_vertex>' +
        `
          float xx = mapRange(position.x, uMin.x, uMax.x, -1., 1.0);
          // twistnormal
          objectNormal = rotate(objectNormal, vec3(1.,0.,0.), 0.5*PI*uTwists*xx + 0.01*uTime*uTwistSpeed);
  
          // circled normal
          objectNormal = rotate(objectNormal, vec3(0.,0.,1.), (xx + 0.01*uTime*uRotateSpeed)*PI);
      
      `
    )

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>' +
        `
        vec3 pos = transformed;
        float theta = (xx + 0.01*uTime*uRotateSpeed)*PI;
        pos = rotate(pos,vec3(1.,0.,0.), 0.5*PI*uTwists*xx + 0.01*uTime*uTwistSpeed);

        vec3 dir = vec3(sin(theta), cos(theta),pos.z);
        vec3 circled = vec3(dir.xy*uRadius,pos.z) + vec3(pos.y*dir.x,pos.y*dir.y,0.);

        transformed = circled;
      `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <output_fragment>',
      '#include <output_fragment>',
      +`
      // gl_FragColor = vec4(1.,0.,0.,1.);
    `
    )
    refMaterial.current.userData.shader = shader
  }

  return (
    <mesh
      ref={refMesh}
      castShadow
      position={[0, 0, 0.6]}
      rotation={[1.2, 0, 0]}
      geometry={geo}
    >
      <meshStandardMaterial
        onBeforeCompile={onBeforeCompile}
        ref={refMaterial}
        attach="material"
        color={config.color}
      />
    </mesh>
  )
}

const Grid = ({ number = 23, lineWidth = 0.026, height = 0.5 }) => (
  // Renders a grid and crosses as instances
  <Instances position={[0, -4, 0]} rotation={[0, 0, 0]}>
    <planeGeometry args={[lineWidth, height]} />
    <meshBasicMaterial color="#999" />
    {Array.from({ length: number }, (_, y) =>
      Array.from({ length: number }, (_, x) => (
        <group
          key={x + ':' + y}
          position={[
            x * 2 - Math.floor(number / 2) * 2,
            -0.01,
            y * 2 - Math.floor(number / 2) * 2
          ]}
        >
          <Instance rotation={[-Math.PI / 2, 0, 0]} />
          <Instance rotation={[-Math.PI / 2, 0, Math.PI / 2]} />
        </group>
      ))
    )}
    <gridHelper args={[100, 100, '#bbb', '#bbb']} position={[0, -0.01, 0]} />
  </Instances>
)

const RotatingTwisted3DText = () => {
  const config = useControls('Text', {
    text: 'basement.studio',
    color: '#FFF',
    fontSize: { value: 1, min: 0.1, max: 2 },
    fontDepth: { value: 0.255, min: 0.01, max: 3.5 },
    uRadius: { value: 1.8, min: 0.1, max: 3 },
    uTwists: { value: 1, min: 0, max: 3, step: 1 },
    uTwistSpeed: { value: 5, min: 0, max: 100, step: 1 },
    uRotateSpeed: { value: 10, min: 0, max: 50, step: 0.01 }
  })

  return (
    <>
      <color attach="background" args={['#000']} />
      <Grid />

      <Suspense fallback={null}>
        <Text config={config} />
      </Suspense>
      <Environment resolution={32}>
        <group rotation={[-Math.PI / 4, -0.3, 0]}>
          <Lightformer
            intensity={20}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={[1, 1, 1]}
          />
        </group>
      </Environment>

      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls
        autoRotateSpeed={-0.1}
        zoomSpeed={0.25}
        minZoom={20}
        maxZoom={100}
        enablePan={false}
        dampingFactor={0.05}
        minPolarAngle={-Math.PI / 2}
        maxPolarAngle={(0.99 * Math.PI) / 2}
      />
      <Stats />
    </>
  )
}

RotatingTwisted3DText.Layout = (props) => (
  <>
    <Leva />
    <R3FCanvasLayout {...props} />
  </>
)
export const title = 'Rotating Twisted 3D Text'
export const tags = ['three', ' typography']

export default RotatingTwisted3DText
