import { Effects, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef } from 'react'
import { ShaderMaterial } from 'three'
import * as THREE from 'three'

const shaderPass = new ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vUv = uv;
    }
  `,
  uniforms: {
    uTime: { value: 0 },
    tDiffuse: { value: null }
  },
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform sampler2D tDiffuse;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float blendOverlay(float base, float blend) {
      return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
    }

    vec3 blendOverlay(vec3 base, vec3 blend) {
      return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
    }

    vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
      return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
    }


    float hash(vec2 p) {
      return fract(
        sin(
          dot(
            p,
            vec2(283.6, 127.1)
          )
        ) * 43758.5453
      );
    }

    #define CENTER vec2(.5)

    #define SAMPLES 10
    #define RADIUS .1

    void main() {
      vec2 uv = vUv;
      vec3 res = vec3(0);

      for(int i = 0; i < SAMPLES; ++i) {
        res += texture2D(tDiffuse, uv).rgb;

        vec2 d = CENTER - uv;

        d *= .5 + .01 * hash(d * uTime);

        uv += d * RADIUS * (1.0 + sin(uTime) * 0.1);
      }

      float noise = random(vUv * 1.0);

      gl_FragColor = vec4(res / float(SAMPLES), 1.0);
      gl_FragColor = vec4(blendOverlay(
				res / float(SAMPLES),
				vec3(noise),
				0.5
			),1.0);
    }
  `
})

const RandomNoiseBlend = () => {
  const tetrahedronRef = useRef<THREE.Mesh>(null!)

  const c = useControls({
    helper: false,
    post: true,
    normal: false,
    z: {
      value: 0,
      min: 0,
      max: Math.PI * 2
    },
    x: {
      value: Math.PI / 2 + Math.PI / 4,
      min: 0,
      max: Math.PI * 2
    },
    y: {
      value: Math.PI / 4,
      min: 0,
      max: Math.PI * 2
    }
  })

  useFrame((s) => {
    shaderPass.uniforms.uTime.value = s.clock.elapsedTime
  })

  return (
    <>
      {c.helper && <gridHelper args={[100, 100]} />}

      <mesh rotation={[c.x, c.y, c.z]} ref={tetrahedronRef}>
        <tetrahedronGeometry args={[1.5, 0]} />
        {c.normal ? (
          <meshNormalMaterial />
        ) : (
          <meshBasicMaterial color="white" />
        )}
      </mesh>

      <OrbitControls />

      <Effects>
        <shaderPass attach="passes" args={[shaderPass]} enabled={c.post} />
      </Effects>
    </>
  )
}

RandomNoiseBlend.Title = 'Random Noise Blend'

export default RandomNoiseBlend
