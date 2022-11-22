import { useFrame } from '@react-three/fiber'
import glsl from 'glslify'
import { FC, useMemo } from 'react'
import * as THREE from 'three'

import { useUniforms } from '~/hooks/use-uniforms'

const particlesVert = glsl/* glsl */ `
#pragma glslify: snoise2 = require('glsl-noise/simplex/2d')

uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uParticleVelocity;
uniform float uParticleDisplaceFactor;

attribute float aScale;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    /* Add noise movement */
    float noiseX = snoise2(vec2(position.x, uTime * uParticleVelocity)) * uParticleDisplaceFactor;
    float noiseY = snoise2(vec2(position.y, uTime * uParticleVelocity)) * uParticleDisplaceFactor;
    float noiseZ = snoise2(vec2(position.z, uTime * uParticleVelocity)) * uParticleDisplaceFactor;

    modelPosition = vec4(
      modelPosition.x + noiseX,
      modelPosition.y + noiseY,
      modelPosition.z + noiseZ,
      modelPosition.w
    );

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    
    gl_PointSize = uSize * aScale * uPixelRatio;
    gl_PointSize *= (1.0 / - viewPosition.z);
}
`

const particlesFrag = glsl/* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;

void main()
{
  float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
  float strength = min(0.05 / distanceToCenter - 0.1, uAlpha);

  gl_FragColor = vec4(uColor, strength);
}
`

export type ParticlesProps = {
  size?: number
  color?: THREE.ColorRepresentation
  alpha?: number
  velocity?: number
  displacementFactor?: number
}

export const Particles: FC<ParticlesProps> = ({
  size = 25,
  color = '#fff',
  alpha = 0.25,
  velocity = 0.1,
  displacementFactor = 0.5
}) => {
  const particleUniforms = useUniforms(
    {
      uTime: { value: 0 },
      uParticleVelocity: { value: 0.1 },
      uParticleDisplaceFactor: { value: 0.5 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uSize: { value: size },
      uColor: { value: new THREE.Color(color) },
      uAlpha: { value: alpha }
    },
    {
      size,
      color,
      alpha,
      velocity,
      displacementFactor
    },
    {
      middlewares: {
        uColor: (curr, input) => {
          curr?.set(input)
        }
      }
    }
  )

  useFrame((state) => {
    particleUniforms.current.uTime.value = state.clock.getElapsedTime()
  })

  const dustParticlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()

    const count = 1000

    const positions = new Float32Array(count * 3)
    const scale = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10

      scale[i] = 1
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))

    return geometry
  }, [])

  return (
    <points geometry={dustParticlesGeometry} dispose={null}>
      <shaderMaterial
        uniforms={particleUniforms.current}
        vertexShader={particlesVert}
        fragmentShader={particlesFrag}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
