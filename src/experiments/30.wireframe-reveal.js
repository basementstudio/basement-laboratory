import {
  Center,
  Clone,
  Environment,
  OrbitControls,
  useGLTF
} from '@react-three/drei'
import { button, Leva } from 'leva'
import { useEffect, useMemo, useRef } from 'react'
import { Box3, Vector3 } from 'three'
import { Color } from 'three/src/math/Color'

import { Loader, useLoader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import { useReproducibleControls } from '~/hooks/use-reproducible-controls'
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
uniform float uAlpha;
uniform float uProgress;
uniform float uAlphaNear;
uniform float uAlphaFar;
uniform vec3 uColor;
uniform vec3 uBoundingMin;
uniform vec3 uBoundingMax;

varying vec4 vPosition;

void main() {
  float centerPos = uBoundingMin.x +
   ((abs(uBoundingMax.x - uBoundingMin.x) + (uAlphaFar * 2.0)) * uProgress) -
    uAlphaFar
  ;

  float depth = distance(centerPos, vPosition.x);

  float alpha = max(0., uAlpha - smoothstep(uAlphaNear, uAlphaFar, depth));

  gl_FragColor = vec4(uColor, alpha);
}
`

const WireframeReveal = () => {
  const animationRef = useRef(null)
  const wireframeRef = useRef(null)
  const groupRef = useRef(null)

  const { loading, setLoaded } = useLoader(({ loading, setLoaded }) => ({
    loading,
    setLoaded
  }))

  const [config, set] = useReproducibleControls(() => {
    return {
      show: {
        value: 'both',
        options: ['wireframe', 'model', 'both']
      },
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
        value: 1.5
      },
      // TODO: Control offset
      // uWireframeTextureOffset: {
      //   min: 0,
      //   max: 10,
      //   value: 2
      // },
      uColor: {
        value: '#FFBE18'
      },
      'Repeat Animation': button(() => {
        animationRef.current?.restart()
      })
    }
  })

  const uniforms = useUniforms(
    {
      uAlpha: { value: 0 },
      uColor: { value: new Color(config.uColor) },
      uWireframeTextureOffset: { value: config.uWireframeTextureOffset },
      uProgress: { value: config.uProgress },
      uAlphaNear: { value: config.uAlphaNear },
      uAlphaFar: { value: config.uAlphaFar },
      uBoundingMin: { value: new Vector3(0, 0, 0) },
      uBoundingMax: { value: new Vector3(0, 0, 0) }
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

          uniform float uAlpha;
          uniform float uProgress;
          uniform float uAlphaNear;
          uniform float uAlphaFar;
          uniform vec3 uColor;
          uniform vec3 uWireframeTextureOffset;
          uniform vec3 uBoundingMin;
          uniform vec3 uBoundingMax;
          
          varying vec4 vPosition;
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_fragment>`,
        `
          #include <dithering_fragment>

          float diff = uAlphaFar - uAlphaNear;

          float centerPos = uBoundingMin.x - diff;

          float depth = distance(centerPos, vPosition.x);

          float revealProgress = abs(uBoundingMax.x - centerPos) * uProgress;

          float alphaFactor = smoothstep(revealProgress, revealProgress + diff, depth);

          /* Limits it to 0 */
          float alpha = max(0., uAlpha - alphaFactor);

          gl_FragColor = vec4(mix(gl_FragColor.rgb, uColor, alphaFactor), alpha);
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
      const boundingBox = new Box3().setFromObject(groupRef.current)

      uniforms.current['uBoundingMin'].value.copy(boundingBox.min)
      uniforms.current['uBoundingMax'].value.copy(boundingBox.max)

      const progress = { value: 0 }

      const tween = gsap.fromTo(
        progress,
        { value: 0 },
        {
          value: 1,
          delay: 0.2,
          duration: DURATION * 6,
          ease: 'power2.inOut',
          onStart: () => {
            uniforms.current['uAlpha'].value = 1
          },
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

  const isBoth = config.show === 'both'
  const isWireframe = config.show === 'wireframe'
  const isModel = config.show === 'model'

  const rotation = [0, 0, Math.PI / 2]

  return (
    <>
      <Environment preset="sunset" />
      <OrbitControls />
      {/* <axesHelper args={[5]} />
      <gridHelper args={[100, 100]} /> */}
      <Center scale={0.2} ref={groupRef}>
        {(isBoth || isModel) && <Clone rotation={rotation} object={objRef} />}
        {(isBoth || isWireframe) && (
          <lineSegments rotation={rotation} ref={wireframeRef}>
            <wireframeGeometry args={[objRef.geometry]} />
            <shaderMaterial
              transparent
              uniforms={uniforms.current}
              vertexShader={vertex}
              fragmentShader={fragment}
            />
          </lineSegments>
        )}
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
