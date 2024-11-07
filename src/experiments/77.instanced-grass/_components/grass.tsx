import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import SimplexNoise from 'simplex-noise'
import * as THREE from 'three'

import { useIsomorphicLayoutEffect } from '~/hooks/use-isomorphic-layout-effect'

import { grassFragmentShader, grassVertexShader } from '../shaders'

export function GrassMesh({ planePosition }: { planePosition: THREE.Vector3 }) {
  const width = 20 * 1.5
  const instances = 50000 * 1.5
  const materialRef = useRef<THREE.RawShaderMaterial>(null)

  const [bladeDiff, bladeAlpha] = useTexture([
    '/textures/grass/blade_diffuse.jpg',
    '/textures/grass/blade_alpha.jpg'
  ])

  const { attributeData, baseGeometry, floorGeometry } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.12, 0.8, 1, 5)
    geo.translate(0, 0.4, 0)

    const floor = new THREE.PlaneGeometry(width, width, 24, 24)
    floor.rotateX(-Math.PI / 2)

    const simplex = new SimplexNoise('seed123')
    const noise2D = (x: number, z: number) => simplex.noise2D(x, z)
    const noiseScale = 0.04
    const heightScale = 3.0

    const positions = floor.attributes.position.array
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const z = positions[i + 2]
      positions[i + 1] = noise2D(x * noiseScale, z * noiseScale) * heightScale
    }
    floor.computeVertexNormals()

    const offsets = []
    const scales = []
    const rotations = []

    for (let i = 0; i < instances; i++) {
      const x = Math.random() * width - width / 2
      const z = Math.random() * width - width / 2
      const y = noise2D(x * noiseScale, z * noiseScale) * heightScale
      offsets.push(x, y, z)

      const scale = 0.8 + Math.random() * 0.5 - 0.2
      scales.push(scale)

      rotations.push(Math.random() * Math.PI * 2)
    }

    return {
      attributeData: { offsets, scales, rotations },
      baseGeometry: geo,
      floorGeometry: floor
    }
  }, [width, instances])

  const planeOffset = new THREE.Vector3(8, 0, 0)

  useFrame((state) => {
    // console.log(planePosition)
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * 2
      materialRef.current.uniforms.uPlanePosition.value = planePosition
      materialRef.current.uniforms.uPlaneOffset.value = planeOffset
    }
  })

  useIsomorphicLayoutEffect(() => {
    return () => {
      baseGeometry.dispose()
      floorGeometry.dispose()
      bladeDiff.dispose()
      bladeAlpha.dispose()
    }
  })

  return (
    <group>
      <mesh>
        <instancedBufferGeometry
          index={baseGeometry.index}
          attributes-position={baseGeometry.attributes.position}
          attributes-uv={baseGeometry.attributes.uv}
        >
          <instancedBufferAttribute
            attach="attributes-offset"
            args={[new Float32Array(attributeData.offsets), 3]}
          />
          <instancedBufferAttribute
            attach="attributes-scale"
            args={[new Float32Array(attributeData.scales), 1]}
          />
          <instancedBufferAttribute
            attach="attributes-rotation"
            args={[new Float32Array(attributeData.rotations), 1]}
          />
        </instancedBufferGeometry>
        <rawShaderMaterial
          ref={materialRef}
          uniforms={{
            map: { value: bladeDiff },
            alphaMap: { value: bladeAlpha },
            uTime: { value: 0 },
            uWindStrength: { value: 1.0 },
            uWindFrequency: { value: 2.0 },
            uPlanePosition: { value: new THREE.Vector3() },
            uPlaneOffset: { value: planeOffset }
          }}
          vertexShader={grassVertexShader}
          fragmentShader={grassFragmentShader}
          side={THREE.DoubleSide}
          transparent={true}
        />
      </mesh>

      <mesh position={[0, 0, 0]} geometry={floorGeometry}>
        <meshBasicMaterial color="#DDE381" />
      </mesh>
    </group>
  )
}
