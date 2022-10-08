import {
  Center,
  Clone,
  Environment,
  OrbitControls,
  useGLTF
} from '@react-three/drei'
import { button, Leva, useControls } from 'leva'
import { useEffect, useMemo, useRef } from 'react'
import { Color } from 'three/src/math/Color'

import { Loader, useLoader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import { useUniforms } from '~/hooks/use-uniforms'
import { DURATION, gsap } from '~/lib/gsap'

const vertex = /* glsl */ `
varying vec4 vPosition;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  vPosition = modelMatrix * vec4(position, 1.0);
}
`

const fragment = /* glsl */ `
uniform float uProgress;
uniform float uAlphaNear;
uniform float uAlphaFar;
uniform vec3 uColor;

varying vec4 vPosition;

float xMin = -5.;
float xMax = 5.;

void main() {
  float centerPos = xMin +
   ((abs(xMax - xMin) + (uAlphaFar * 2.0)) * uProgress) -
    uAlphaFar
  ;

  float depth = distance(centerPos, vPosition.x);

  float alpha = 1. - smoothstep(uAlphaNear, uAlphaFar, depth);

  gl_FragColor = vec4(uColor, alpha);
}
`

const WireframeReveal = () => {
  const { loading, setLoaded } = useLoader(({ loading, setLoaded }) => ({
    loading,
    setLoaded
  }))
  const animationRef = useRef(null)

  const [config, set] = useControls(() => ({
    uProgress: {
      min: 0,
      max: 1,
      value: 0
    },
    uAlphaNear: {
      min: 0,
      max: 10,
      value: 0
    },
    uAlphaFar: {
      min: 0,
      max: 10,
      value: 3
    },
    uWireframeTextureOffset: {
      min: 0,
      max: 10,
      value: 2
    },
    uColor: {
      value: '#FFBE18'
    },
    'Repeat Animation': button(() => {
      animationRef.current?.restart()
    })
  }))

  const uniforms = useUniforms(
    {
      uColor: { value: new Color(config.uColor) },
      uWireframeTextureOffset: { value: config.uWireframeTextureOffset },
      uProgress: { value: config.uProgress },
      uAlphaNear: { value: config.uAlphaNear },
      uAlphaFar: { value: config.uAlphaFar }
    },
    config,
    {
      middlewares: {
        uColor: (curr, input) => {
          curr?.set(input)
        }
      }
    }
  )

  const dagger = useGLTF(
    `/models/dagger.glb`,
    undefined,
    undefined,
    (loader) => {
      loader.manager.onLoad = () => {
        setLoaded()
      }
    }
  )

  const objRef = useMemo(() => {
    const trgt = dagger.scene.children[0].children[0].children[0]

    const patch = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        `#include <clipping_planes_pars_vertex>`,
        `
          #include <clipping_planes_pars_vertex>

          varying vec4 vPosition;
        `
      )

      shader.vertexShader = shader.vertexShader.replace(
        `#include <fog_vertex>`,
        `
          #include <fog_vertex>

          vPosition = modelMatrix * vec4(position, 1.0);
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <clipping_planes_pars_fragment>`,
        `
          #include <clipping_planes_pars_fragment>

          uniform float uProgress;
          uniform float uAlphaNear;
          uniform float uAlphaFar;
          uniform vec3 uColor;
          uniform vec3 uWireframeTextureOffset;
          
          varying vec4 vPosition;


          float xMin = -5.;
          float xMax = 5.;
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_fragment>`,
        `
          #include <dithering_fragment>

          float diff = uAlphaFar - uAlphaNear;

          float centerPos = xMin - diff;

          float depth = distance(centerPos, vPosition.x);

          float revealProgress = abs(xMax - centerPos) * uProgress;

          float alpha = 1. - smoothstep(revealProgress, revealProgress + diff, depth);

          gl_FragColor = vec4(gl_FragColor.rgb, alpha);
        `
      )

      Object.keys(uniforms.current).map((key) => {
        shader.uniforms[key] = uniforms.current[key]
      })
    }

    trgt.material.transparent = true
    trgt.material.onBeforeCompile = patch

    return trgt
  }, [dagger])

  useEffect(() => {
    if (!loading) {
      const progress = { value: 0 }

      const tween = gsap.fromTo(
        progress,
        { value: 0 },
        {
          value: 1,
          duration: DURATION * 6,
          ease: 'power2.inOut',
          onUpdate: () => {
            set({ uProgress: progress.value })
          }
        }
      )

      animationRef.current = tween

      return () => {
        tween.kill()
      }
    }
  }, [loading, set])

  return (
    <>
      <Environment preset="apartment" />
      <OrbitControls />
      {/* <axesHelper /> */}
      {/* <gridHelper args={[100, 100]} /> */}
      <Center>
        <group rotation={[0, 0, Math.PI / 2]} scale={0.2}>
          <Clone object={objRef} />
          <lineSegments>
            <wireframeGeometry args={[objRef.geometry]} />
            <shaderMaterial
              transparent
              uniforms={uniforms.current}
              vertexShader={vertex}
              fragmentShader={fragment}
            />
          </lineSegments>
        </group>
      </Center>
    </>
  )
}

WireframeReveal.Layout = (props) => (
  <>
    <Leva />
    <R3FCanvasLayout {...props} htmlChildren={<Loader />} />
  </>
)

WireframeReveal.Title = 'Wireframe model reveal'
WireframeReveal.Description = ''
WireframeReveal.Tags = 'shaders,private'

export default WireframeReveal
