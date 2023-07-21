import { OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { folder, useControls } from 'leva'
import * as THREE from 'three'

import { useUniforms } from '~/hooks/use-uniforms'

const SunRayCone = () => {
  const noiseTexture = useTexture('/textures/fbm-noise.png', (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.flipY = true
  })

  const controls = useControls({
    debug: false,
    Geometry: folder({
      radiusTop: {
        value: 0.4,
        min: 0,
        max: 10
      },
      radiusBottom: {
        value: 4,
        min: 0,
        max: 10
      },
      height: {
        value: 8,
        min: 0,
        max: 30
      }
    }),
    Material: folder({
      alpha: {
        value: 1,
        min: 0,
        max: 1
      },
      glowAlpha: {
        value: 0.6,
        min: 0,
        max: 1
      },
      topFadeMin: {
        value: 0.75,
        min: 0,
        max: 1
      },
      raysColor: '#ffffff',
      glowColor: '#ffffff',
      raysStepMin: {
        value: 0.2,
        min: 0,
        max: 1
      },
      raysStepMax: {
        value: 0.8,
        min: 0,
        max: 1
      },
      glowStepMin: {
        value: 0.5,
        min: 0,
        max: 1
      }
    })
  })

  const uniforms = useUniforms(
    {
      uTexture: { value: noiseTexture },
      uTime: { value: 0 },
      uBaseAlpha: { value: 0.25 },
      uGlowAlpha: { value: 0.6 },
      uTopFadeMin: { value: 0.75 },
      uRaysColor: { value: new THREE.Color('#ffffffff') },
      uGlowColor: { value: new THREE.Color('#ffffffff') },
      uRaysStepMin: { value: 0.2 },
      uRaysStepMax: { value: 0.8 },
      uGlowStepMin: { value: 0.5 }
    },
    {
      uBaseAlpha: controls.alpha,
      uGlowAlpha: controls.glowAlpha,
      uTopFadeMin: controls.topFadeMin,
      uRaysColor: controls.raysColor,
      uGlowColor: controls.glowColor,
      uRaysStepMin: controls.raysStepMin,
      uRaysStepMax: controls.raysStepMax,
      uGlowStepMin: controls.glowStepMin
    },
    {
      middlewares: {
        uRaysColor: (curr, input) => {
          curr?.set(input)
        },
        uGlowColor: (curr, input) => {
          curr?.set(input)
        }
      }
    }
  )

  useFrame(({ clock }) => {
    uniforms.current.uTime.value = clock.getElapsedTime()
  })

  const position = [0, controls.height / 2, 0]
  const cylinderArgs = [
    controls.radiusTop,
    controls.radiusBottom,
    controls.height,
    32,
    1,
    true,
    Math.PI / 2,
    Math.PI
  ]

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 10, 20]} />
      <gridHelper args={[20, 20]} />
      <axesHelper />
      <mesh position={position}>
        <cylinderGeometry args={cylinderArgs} />
        <shaderMaterial
          // eslint-disable-next-line prettier/prettier
          vertexShader={/* glsl */`
            varying vec2 vUv;

            void main(){
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `
          }
          // eslint-disable-next-line prettier/prettier
          fragmentShader={/* glsl */`
            varying vec2 vUv;

            uniform sampler2D uTexture;
            uniform float uTime;
            uniform float uBaseAlpha;
            uniform float uGlowAlpha;
            uniform float uTopFadeMin;
            uniform vec3 uRaysColor;
            uniform vec3 uGlowColor;
            uniform float uRaysStepMin;
            uniform float uRaysStepMax;
            uniform float uGlowStepMin;

            void main() { 
              vec2 raysNoiseUv = vUv;

              // Pick a place on the noise texture based on the uv.y, we are only using a pixel row
              raysNoiseUv.y = 0.5;
              // Move the noise texture over time to animate the rays
              raysNoiseUv.x += uTime * 0.023;

              vec4 noise = texture2D(uTexture, raysNoiseUv);

              // Step the noise texture to only get the ray influence factors in the noise range we want
              // Near the min value, the rays are less strong so will fade out faster
              // Near the max value, the rays are stronger so will fade out slower
              float rayFactor = smoothstep(uRaysStepMin, uRaysStepMax, noise.r);
              // Fade out the rays based on the length of the cone multiplied by the rays factor
              float rayFade = vUv.y - rayFactor * 0.1;
              
              // uv.y = 1 is the top of the cone, the uTopFadeMin sets the point where the cone starts to fade out till uv.y = 1
              float coneTopFade = 1.0 - smoothstep(uTopFadeMin, 1.0, vUv.y);
              // Defines where the glow starts to influence the ray cone on the way to the top
              float sourceGlowFactor = smoothstep(uGlowStepMin, 1.0, vUv.y);

              vec3 color = uRaysColor * rayFactor;
              color = mix(color, uGlowColor, sourceGlowFactor);

              // Mix the base alpha rayFade alpha to get the final alpha, we aditionally multiply the rayFactor to the mix to
              // increase the rays alpha difference between the strong and weak rays, this gives a better result
              float alpha = uBaseAlpha * rayFade * rayFactor;
              // Mix between the ray based calculated alpha and the glow alpha based on the sourceGlowFactor
              alpha = mix(alpha, uGlowAlpha, sourceGlowFactor);
              // Overwrite take in account the cone top fade, this will fade out both the rays and glow on the top of the cone
              alpha *= coneTopFade;

              gl_FragColor.rgb = color;
              gl_FragColor.a = alpha;
            }
          `
          }
          uniforms={uniforms.current}
          transparent
          side={THREE.DoubleSide}
        />
        {/* <meshBasicMaterial map={debugTexture} /> */}
      </mesh>
      <mesh position={position} visible={controls.debug}>
        <cylinderGeometry args={cylinderArgs} />
        <meshBasicMaterial color="white" wireframe />
      </mesh>
      <OrbitControls />
    </>
  )
}

SunRayCone.Title = 'Sun Rays Cone'
SunRayCone.Description =
  'Fake sunrays proyected on a cone using a noise texture'
SunRayCone.Tags = 'threejs'

export default SunRayCone
