import {
  Grid,
  OrbitControls,
  PerspectiveCamera,
  useTexture
} from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { folder, useControls } from 'leva'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

const Effects = () => {
  const controls = useControls({
    bloom: folder({
      luminanceThreshold: {
        value: 0,
        min: 0,
        max: 1
      },
      luminanceSmoothing: {
        value: 0.7,
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

const count = 1000

const vertex = /*glsl*/ `
    uniform float uTime;
    uniform float uRadius;

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

    // New function to orient particles
    mat3 lookAt(vec3 from, vec3 to, vec3 up) {
        vec3 forward = normalize(to - from);
        vec3 right = normalize(cross(forward, up));
        vec3 newUp = cross(right, forward);
        return mat3(right, newUp, -forward);
    }

    void main() {
        float phi = 2.0 * 3.14159265359 * fract(sin(float(gl_VertexID)) * 43758.5453);
        float cosTheta = 1.0 - 2.0 * float(gl_VertexID) / float(${count});
        float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
        
        // Slight deformation
        float deformation = sin(phi * 5.0 + uTime * 2.0) * 0.05;
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

        // Orient particle tangent to the sphere
        mat3 orientationMatrix = lookAt(vec3(0.0), particlePosition, vec3(0.0, 1.0, 0.0));
        vec3 orientedPosition = particlePosition + orientationMatrix * vec3(0.0, 0.0, 0.0);

        vDistance = length(particlePosition) / uRadius;

        vec4 modelPosition = modelMatrix * vec4(orientedPosition, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;

        gl_Position = projectedPosition;
        
        vUv = uv;

        float size = 100.0;
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
        
        // Apply water-like deformation
        float waveStrength = 0.01;
        float waveSpeed = 2.0;
        vec2 wave = vec2(
            sin(rotatedCoords.y * 10.0 + uTime * waveSpeed) * waveStrength,
            sin(rotatedCoords.x * 10.0 + uTime * waveSpeed) * waveStrength
        );
        vec2 deformedCoords = rotatedCoords + wave;
        
        vec4 texColor = texture2D(uTexture, deformedCoords);
        
        vec3 colorCenter = vec3(1.0, 0.6, 0.0); // Yellow
        vec3 colorOuter = vec3(1.0, 0.0, 0.0); // Orange
        
        float strength = texColor.r; // Use red channel for shape

        // Calculate distance from particle center
        float distanceFromCenter = length(rotatedCoords - 0.5);

        // Create gradient based on distance from center
        vec3 color = mix(colorCenter, colorOuter, distanceFromCenter);
        
        // Apply butterfly shape
        color = mix(vec3(0.0), color, strength);
        
        // Fire-like flickering effect
        float noise = fract(sin(dot(rotatedCoords, vec2(12.9898, 78.233))) * 43758.5453);
        float flicker = noise * 0.2 + 0.8;
        float fireEffect = sin(uTime * 2.0 + vDistance * 3.0) * 0.1 + 0.9;
        float blink = flicker * fireEffect;
        
        color *= blink;
        
        gl_FragColor = vec4(color, strength * texColor.a * blink);
    }
  `

const ButterflyParticleSphere = () => {
  const pointsRef =
    useRef<
      THREE.Points<
        THREE.BufferGeometry<THREE.NormalBufferAttributes>,
        THREE.Material | THREE.Material[]
      >
    >(null)
  const radius = 1
  const butterflyTexture = useTexture('/images/butterfly-shape.jpg')

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
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
      }
      // Add any other attributes here
    }),
    [butterflyTexture]
  )

  useFrame((state) => {
    if (!pointsRef.current) return

    const { clock } = state
    pointsRef.current.rotation.y += 0.01

    // @ts-ignore
    pointsRef.current.material.uniforms.uTime.value = clock.elapsedTime
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
          //   transparent
        />
      </points>

      <Effects />

      <PerspectiveCamera makeDefault position={[0, 3, 6]} fov={50} />
      <ambientLight intensity={0.5} />
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
