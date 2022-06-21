import { ScrollProvider, tunnel } from '@basementstudio/definitive-scroll'
import { Canvas } from '@basementstudio/definitive-scroll/three'
import { OrbitControls, useTexture } from '@react-three/drei'
import { useFrame, useLoader } from '@react-three/fiber'
import { useControls } from 'leva'
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'

import { NavigationLayout } from '../components/layout/navigation-layout'

const WebGL = tunnel()

const customUvTransform = new THREE.Matrix3()

const Model = () => {
  const meshRef = useRef()
  const disp = useLoader(EXRLoader, '/textures/11.displacement.exr')
  const [map, textures] = useTexture(
    [
      '/textures/11.map.jpeg',
      '/textures/11.normal.png',
      '/textures/11.displacement.png'
    ],
    ([map]) => {
      map.wrapS = THREE.RepeatWrapping
      map.wrapT = THREE.RepeatWrapping
    }
  )
  const CONFIG = useControls({
    width: {
      min: 0,
      step: 0.1,
      value: 0.3,
      max: 2
    },
    height: {
      min: 0,
      step: 0.1,
      value: 4,
      max: 4
    },
    segments: {
      value: 512
    },
    displacementScale: {
      min: 0,
      step: 0.1,
      value: 2.7,
      max: 2.7
    },
    normalScale: {
      value: 3.4
    }
  })

  const scrollHeight = useMemo(() => document.documentElement.scrollHeight, [])

  useFrame(() => {
    const offset = ((scrollHeight - window.scrollY) / scrollHeight - 1) * 5
    customUvTransform.setUvTransform(0, offset, 1, 1, 0, 0, 0)
  })

  return (
    <>
      <OrbitControls enableZoom={false} />
      <ambientLight />
      <mesh ref={meshRef} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry
          attach="geometry"
          args={[
            CONFIG.width,
            CONFIG.width,
            CONFIG.height,
            CONFIG.segments,
            CONFIG.segments,
            true
          ]}
        />
        <meshPhongMaterial
          onBeforeCompile={(shader) => {
            shader.uniforms.uCustomUvTransform = {
              value: customUvTransform
            }

            shader.vertexShader = shader.vertexShader.replace(
              '#define PHONG',
              /* glsl */ `
              #define PHONG

              uniform mat3 uCustomUvTransform;

              varying mat3 vUvTransform;
              varying mat3 vCustomUvTransform;
              `
            )

            shader.vertexShader = shader.vertexShader.replace(
              '#include <fog_vertex>',
              /* glsl */ `
                #include <fog_vertex>

                vUvTransform = uvTransform;
                vCustomUvTransform = uCustomUvTransform;
              `
            )

            shader.fragmentShader = shader.fragmentShader.replace(
              '#define PHONG',
              /* glsl */ `
                #define PHONG

                varying mat3 vUvTransform;
                varying mat3 vCustomUvTransform;
              `
            )

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <map_fragment>',
              /* glsl */ `
                vec2 untransformedUv     = ( inverse(vUvTransform) * vec3( vUv, 1 ) ).xy;
                vec2 customTransformedUv = ( vCustomUvTransform    * vec3( untransformedUv, 1 ) ).xy;

                vec4 sampledDiffuseColor = texture2D( map, customTransformedUv );

                diffuseColor *= sampledDiffuseColor;
              `
            )
          }}
          map={map}
          displacementMap={disp}
          displacementScale={CONFIG.displacementScale}
          normalMap={textures}
          normalScale={CONFIG.normalScale}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  )
}

const MoveMapTexture = () => {
  return (
    <>
      <WebGL.In>
        <Model />
      </WebGL.In>
      <div style={{ height: '150vh' }} />
    </>
  )
}

MoveMapTexture.getLayout = ({ Component, title, description, slug }) => (
  <NavigationLayout slug={slug} description={description} title={title}>
    <div style={{ position: 'fixed', height: '100vh', width: '100vw' }}>
      <Canvas>
        <WebGL.Out />
      </Canvas>
    </div>

    <ScrollProvider>
      <Component />
    </ScrollProvider>
  </NavigationLayout>
)

MoveMapTexture.Title = 'Move map texture'
MoveMapTexture.Description = (
  <p>
    Inspired in{' '}
    <a href="https://www.zikd.space/en/">https://www.zikd.space/en/</a>.
    <br />
    <br />
    Here I extended the <code>MeshPhongMaterial</code> shader replacing the map
    texture uv mapping implementation, to use a custom transformed uv set.
  </p>
)
MoveMapTexture.Tags = 'shaders'

export default MoveMapTexture
