import { OrbitControls, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef } from 'react'
import * as THREE from 'three'

import { useUniforms } from '~/hooks/use-uniforms'

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uFactor;
  uniform vec2 uResolution;
  
  varying vec2 vUv;

  float smoothSquare (float x) {
    float delta = 0.04;
    float k = 0.5;
    float w = fract(x);
    return
      smoothstep(k - delta, k, w) *
      (1. - smoothstep(k, k + delta, w));
  }
  
  float lattice (vec2 p) {
    return smoothSquare(p.x) + smoothSquare(p.y);
  }

  vec2 translateAndScale (vec2 p, float s) {
    return p * s - s / 2.;
  }

  mat2 rotate2d(float alpha){
    return mat2(
      cos(alpha), -sin(alpha),
      sin(alpha), cos(alpha)
    );
  }
  
  vec2 warp (vec2 p) {
    float t = uFactor;
    float r = length(p + 0.5);
    float alpha = t * r;
    return rotate2d(alpha) * p;
  }

  vec3 field(vec2 p) {
    float z = warp(lattice(p));
    return vec3(z, 0., 1. - z);
  }
 

  void main() {
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.);
    vec2 uv = vUv * aspect;

    vec2 newUv = (uv * 10.);

    vec3 c = field(newUv + 0.5);
	  gl_FragColor = vec4(c, 1.0);
  }
`

const ShaderTests = () => {
  const { /* screen,  */ viewport } = useThree((s) => ({
    viewport: s.viewport,
    screen: s.size
  }))
  const planeRef = useRef()
  const texture = useTexture('/textures/texture-debugger.jpg', () => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
  })

  const controls = useControls({
    factor: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01
    }
  })

  const uniforms = useUniforms(
    {
      uWarpFactor: { value: 0.9 },
      uFactor: { value: 0.5 },
      uTime: { value: 0 },
      uTexture: { value: texture },
      uResolution: { value: [viewport.width, viewport.height] }
    },
    {
      uFactor: controls.factor
    }
  )

  useFrame((state, delta) => {
    if (!planeRef.current) return
    planeRef.current.material.uniforms.uTime.value += delta * 10
  })

  return (
    <>
      <OrbitControls />
      <mesh scale={[viewport.width, viewport.height, 0]} ref={planeRef}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          uniforms={uniforms.current}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>
    </>
  )
}

export const title = 'Shader Tests'
ShaderTests.Tags = 'shader,three'
export const description = `I made this experiment to test some interesting shader functions. I'm not sure what I'm going to do with it yet, but I'm sure I'll find a use for it eventually.`

export default ShaderTests
