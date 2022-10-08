import { Center, Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { Leva, useControls } from 'leva'
import { useEffect, useRef } from 'react'

import { Loader, useLoader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
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

varying vec4 vPosition;

float xMin = -5.;
float xMax = 5.;

void main() {
  float centerPos = xMin + (
    (abs(xMax - xMin) + (uAlphaFar * 2.0)) * uProgress) -
    uAlphaFar
  ;

  float depth = distance(centerPos, vPosition.x);

  float alpha = 1. - smoothstep(uAlphaNear, uAlphaFar, depth);

  gl_FragColor = vec4(1., 1., 1., alpha);
}
`

const WireframeReveal = () => {
  const { loading, setLoaded } = useLoader(({ loading, setLoaded }) => ({
    loading,
    setLoaded
  }))
  const [config, set] = useControls(() => ({
    uProgress: {
      min: 0,
      max: 1,
      value: 0
    },
    uAlphaNear: {
      min: 0,
      max: 10,
      value: 1.4
    },
    uAlphaFar: {
      min: 0,
      max: 10,
      value: 8
    }
  }))

  const uniforms = useRef({
    uProgress: { value: config.uProgress },
    uAlphaNear: { value: config.uAlphaNear },
    uAlphaFar: { value: config.uAlphaFar }
  })

  const dagger = useGLTF(
    `/models/dagger.glb`,
    undefined,
    undefined,
    (loader) => {
      loader.manager.onLoad = () => setLoaded()
    }
  )

  useEffect(() => {
    if (!loading) {
      const progress = { value: 0 }

      gsap.to(progress, {
        value: 1,
        delay: 2,
        duration: DURATION * 6,
        ease: 'power2.inOut',
        onUpdate: () => {
          set({ uProgress: progress.value })
        }
      })
    }
  }, [loading])

  useEffect(() => {
    /* Update Uniforms */
    const middlewares = {}
    const uniformKeys = Object.keys(uniforms.current)
    const middlewareMissingKeys = Object.keys(middlewares).filter(
      (k) => !uniformKeys.includes(k)
    )

    const include = [...uniformKeys, ...middlewareMissingKeys]
    const exclude = []

    Object.keys(config)
      .filter((key) => !exclude.includes(key))
      .filter((key) => include.includes(key))
      .map((key) => {
        if (middlewares[key]) {
          const res = middlewares[key](
            uniforms.current[key]?.value,
            config[key]
          )

          if (res != undefined) {
            uniforms.current[key].value = res
          }
        } else if (config[key] != undefined) {
          uniforms.current[key].value = config[key]
        }
      })
  }, [config])

  return (
    <>
      {/* <Box /> */}
      <Environment preset="apartment" />
      <OrbitControls />
      <axesHelper />
      {/* <gridHelper args={[100, 100]} /> */}
      <Center>
        <group rotation={[0, 0, Math.PI / 2]} scale={0.2}>
          {/* <primitive object={dagger.scene} /> */}
          <lineSegments>
            <wireframeGeometry
              args={[dagger.scene.children[0].children[0].children[0].geometry]}
            />
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
WireframeReveal.Tags = 'shaders'

export default WireframeReveal
