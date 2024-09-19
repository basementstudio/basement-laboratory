import {
  Grid,
  OrbitControls,
  PerspectiveCamera,
  useTexture
} from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import gsap from 'gsap'
import { folder, useControls } from 'leva'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

import FakeGlowMaterial from './fade-glow-material'

const Effects = () => {
  const controls = useControls({
    bloom: folder({
      luminanceThreshold: {
        value: 0.16,
        min: 0,
        max: 1
      },
      luminanceSmoothing: {
        value: 1,
        min: 0,
        max: 1
      },
      bloomIntensity: {
        value: 13,
        min: 5,
        max: 30
      }
    })
  })

  return (
    <EffectComposer multisampling={0} stencilBuffer={true}>
      <Bloom
        luminanceThreshold={controls.luminanceThreshold}
        luminanceSmoothing={controls.luminanceSmoothing}
        intensity={controls.bloomIntensity}
        height={300}
      />
    </EffectComposer>
  )
}

const vertex = /*glsl*/ `
    uniform float uTime;
    uniform float uRadius;
    uniform float uParticlesCount;
    uniform float uParticleSize;
    uniform float uParticleDispersion;

    varying float vDistance;
    varying vec2 vUv;

    // Existing rotation function
    mat3 rotation3dY(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat3(
            c, 0.0, -s,
            0.0, 1.0, 0.0,
            s, 0.0, c
        );
    }

    // Random rotation function
    mat3 randomRotation(float seed) {
        float rx = sin(seed * 1234.5678);
        float ry = cos(seed * 8765.4321);
        float rz = sin(seed * 9876.5432);
        
        float cx = cos(rx), sx = sin(rx);
        float cy = cos(ry), sy = sin(ry);
        float cz = cos(rz), sz = sin(rz);
        
        return mat3(
            cy*cz, -cy*sz, sy,
            cx*sz + sx*sy*cz, cx*cz - sx*sy*sz, -sx*cy,
            sx*sz - cx*sy*cz, sx*cz + cx*sy*sz, cx*cy
        );
    }

    void main() {
        float phi = 2.0 * 3.14159265359 * fract(sin(float(gl_VertexID)) * 43758.5453);
        float cosTheta = 1.0 - 2.0 * float(gl_VertexID) / float(uParticlesCount);
        float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
        
        // Slight deformation
        float deformation = sin(phi * 5.0 + uTime * 2.0) * uParticleDispersion;
        vec3 normalizedPosition = vec3(
            cos(phi) * sinTheta * (1.0 + deformation),
            sin(phi) * sinTheta * (1.0 + deformation),
            cosTheta * (1.0 + deformation * 0.5)
        ) * uRadius;

        vec3 particlePosition = normalizedPosition * rotation3dY(uTime * 0.3);

        // Individual random rotation
        float seed = float(gl_VertexID) * 0.1;
        mat3 randomRot = randomRotation(seed);
        particlePosition = randomRot * particlePosition;

        vDistance = length(particlePosition) / uRadius;

        vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;

        gl_Position = projectedPosition;
        
        vUv = uv;

        float size = uParticleSize;
        gl_PointSize = size;
        gl_PointSize *= (1.0 / - viewPosition.z);
    }
`

const fragment = /*glsl*/ `
    uniform sampler2D uTexture;
    uniform float uTime;

    varying float vDistance;
    varying vec2 vUv;

    // Function to generate noise
    float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
        // Rotate texture coordinates 180 degrees
        vec2 rotatedCoords = vec2(1.0 - gl_PointCoord.x, 1.0 - gl_PointCoord.y);
        
        vec4 texColor = texture2D(uTexture, rotatedCoords);
        
        vec3 colorCenter = vec3(1.0, 0.6, 0.0); // Yellow
        vec3 colorOuter = vec3(1.0, 0.0, 0.0); // Orange
        
        float strength = texColor.r; // Use red channel for shape

        // Calculate distance from particle center
        float distanceFromCenter = length(rotatedCoords - 0.5);

        // Create gradient based on distance from center
        vec3 color = mix(colorCenter, colorOuter, distanceFromCenter);
        
        // Apply butterfly shape
        color = mix(vec3(0.0), color, strength);
        
        // Fire-like flicker effect
        float noise = fract(sin(dot(rotatedCoords, vec2(12.9898, 78.233))) * 43758.5453);
        float flicker = noise * 0.2 + 0.8;
        float fireEffect = sin(uTime * 2.0 + vDistance * 3.0) * 0.1 + 0.9;
        float blink = flicker * fireEffect;
        
        color *= blink;
        
        gl_FragColor = vec4(color, strength * texColor.a * blink);
    }
  `

const PARTICLES_COUNT = 1000

const ButterflyParticleSphere = () => {
  const [animationFinished, setAnimationFinished] = useState(true)
  const pointsRef =
    useRef<
      THREE.Points<
        THREE.BufferGeometry<THREE.NormalBufferAttributes>,
        THREE.Material | THREE.Material[]
      >
    >(null)
  const glowMeshRef = useRef<THREE.Mesh>(null)
  const radius = 1
  const butterflyTexture = useTexture('/images/butterfly-shape.jpg')

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(PARTICLES_COUNT * 3)

    for (let i = 0; i < PARTICLES_COUNT; i++) {
      const distance = Math.sqrt(Math.random()) * radius
      const theta = THREE.MathUtils.randFloatSpread(360)
      const phi = THREE.MathUtils.randFloatSpread(360)

      const x = distance * Math.sin(theta) * Math.cos(phi)
      const y = distance * Math.sin(theta) * Math.sin(phi)
      const z = distance * Math.cos(theta)

      positions.set([x, y, z], i * 3)
    }

    return positions
  }, [])

  const { uRadius, uParticlesCount, uParticleSize, uParticleDispersion } =
    useControls({
      shape: folder({
        uRadius: {
          value: radius,
          min: 0.1,
          max: 15
        },
        uParticlesCount: {
          value: PARTICLES_COUNT,
          min: 0,
          max: PARTICLES_COUNT * 2
        },
        uParticleSize: {
          value: 100,
          min: 1,
          max: 200
        },
        uParticleDispersion: {
          value: 0.05,
          min: 0.001,
          max: 1
        }
      })
    })

  const uniforms = useMemo(
    () => ({
      uTime: {
        value: 0.0
      },
      uRadius: {
        value: radius
      },
      uTexture: {
        value: butterflyTexture
      },
      uParticlesCount: {
        value: PARTICLES_COUNT
      },
      uParticleSize: {
        value: 100
      },
      uParticleDispersion: {
        value: 0.05
      }
    }),
    [butterflyTexture]
  )

  useEffect(() => {
    setAnimationFinished(true)
    // const tl = gsap.timeline({ onComplete: () => setAnimationFinished(true) })

    // tl.fromTo(
    //   uniforms.uRadius,
    //   { value: 0 },
    //   { value: 1, duration: 8, ease: 'back.inOut(1)' }
    // )
    //   .fromTo(
    //     uniforms.uParticleDispersion,
    //     { value: 0.01 },
    //     { value: 0.05, duration: 8, ease: 'back.inOut(1)' },
    //     0
    //   )
    //   .fromTo(
    //     uniforms.uParticleSize,
    //     { value: 1 },
    //     { value: 100, duration: 8, ease: 'back.inOut(1)' },
    //     0
    //   )
    //   .fromTo(
    //     uniforms.uParticlesCount,
    //     { value: PARTICLES_COUNT / 2 },
    //     { value: PARTICLES_COUNT, duration: 8, ease: 'back.inOut(1)' },
    //     0
    //   )
  }, [
    uniforms.uParticleDispersion,
    uniforms.uParticleSize,
    uniforms.uParticlesCount,
    uniforms.uRadius
  ])

  useFrame((state) => {
    if (!pointsRef.current || !glowMeshRef.current) return

    const { clock } = state
    pointsRef.current.rotation.y += 0.01

    // @ts-ignore
    pointsRef.current.material.uniforms.uTime.value = clock.elapsedTime

    glowMeshRef.current.scale.set(
      uniforms.uRadius.value,
      uniforms.uRadius.value,
      uniforms.uRadius.value
    )

    if (animationFinished) {
      // @ts-ignore
      uniforms.uRadius.value = uRadius

      // @ts-ignore
      pointsRef.current.material.uniforms.uParticlesCount.value =
        uParticlesCount

      // @ts-ignore
      pointsRef.current.material.uniforms.uParticleSize.value = uParticleSize

      //@ts-ignore
      pointsRef.current.material.uniforms.uParticleDispersion.value =
        uParticleDispersion
    }
  })

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlesPosition.length / 3}
            array={particlesPosition}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          blending={THREE.CustomBlending}
          depthWrite={false}
          depthTest={true}
          fragmentShader={fragment}
          vertexShader={vertex}
          uniforms={uniforms}
        />
      </points>

      {/* bloom effect with geometry and shader */}
      <mesh ref={glowMeshRef}>
        <sphereGeometry />
        <FakeGlowMaterial
          glowColor="#FF8200"
          glowInternalRadius={0.1}
          falloff={5}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Effects />

      <PerspectiveCamera makeDefault position={[0, 3, 6]} fov={50} />
      <OrbitControls />
      <Grid
        args={[10.5, 10.5]}
        cellThickness={1.0}
        cellColor={'#727272'}
        scale={[0.6, 0.6, 0.6]}
        position={[0, -1, 0]}
        cellSize={1}
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor={'#8d8d8d'}
        fadeDistance={25}
        fadeStrength={1.0}
        infiniteGridz
      />
    </>
  )
}

ButterflyParticleSphere.Layout = (props: any) => (
  <R3FCanvasLayout
    gl={{
      antialias: false,
      autoClear: false,
      alpha: false,
      powerPreference: 'high-performance',
      outputColorSpace: THREE.SRGBColorSpace,
      toneMapping: THREE.NoToneMapping
    }}
    {...props}
  />
)

ButterflyParticleSphere.Title = 'Butterfly Particle Sphere'
ButterflyParticleSphere.Description = 'Butterfly particle sphere'

export default ButterflyParticleSphere
