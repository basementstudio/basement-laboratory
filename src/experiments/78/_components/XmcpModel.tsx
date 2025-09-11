import React, { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three/examples/jsm/Addons.js'
import { folder, useControls } from 'leva'
import { useFrame } from '@react-three/fiber'

import { ditheringVertexShader, ditheringFragmentShader } from '../shaders'

type GLTFResult = GLTF & {
  nodes: {
    Xmcp_1: THREE.Mesh
    Xmcp_2: THREE.Mesh
  }
  materials: {
    Glass: THREE.MeshPhysicalMaterial
  }
}

export default function XMCPModel() {
  const { nodes } = useGLTF('/models/xmcp.glb') as any as GLTFResult
  const groupRef = useRef<THREE.Group>(null)

  // Shader controls
  const shaderControls = useControls({
    'Metallic Dithering': folder({
      metallic: {
        value: 0.9,
        min: 0,
        max: 1,
        step: 0.01
      },
      roughness: {
        value: 0.1,
        min: 0,
        max: 1,
        step: 0.01
      },
      baseColor: {
        value: '#ebebeb'
      },
      ditherSize: {
        value: 0.9,
        min: 0.1,
        max: 2.0,
        step: 0.1
      },
      ditherStrength: {
        value: 0.28,
        min: 0,
        max: 1,
        step: 0.01
      }
    })
  })

  // Create shader material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: ditheringVertexShader,
      fragmentShader: ditheringFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uCameraPosition: { value: new THREE.Vector3() },
        uMetallic: { value: shaderControls.metallic },
        uRoughness: { value: shaderControls.roughness },
        uBaseColor: { value: new THREE.Color(shaderControls.baseColor) },
        uDitherSize: { value: shaderControls.ditherSize },
        uDitherStrength: { value: shaderControls.ditherStrength }
      },
      side: THREE.DoubleSide
    })
  }, [])

  useFrame((state) => {
    if (!groupRef.current || !shaderMaterial.uniforms) return

    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.4
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2

    // Update shader uniforms
    shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime
    shaderMaterial.uniforms.uCameraPosition.value.copy(state.camera.position)
    shaderMaterial.uniforms.uMetallic.value = shaderControls.metallic
    shaderMaterial.uniforms.uRoughness.value = shaderControls.roughness
    shaderMaterial.uniforms.uBaseColor.value.set(shaderControls.baseColor)
    shaderMaterial.uniforms.uDitherSize.value = shaderControls.ditherSize
    shaderMaterial.uniforms.uDitherStrength.value =
      shaderControls.ditherStrength
  })

  return (
    <>
      <group ref={groupRef} scale-z={5} scale-x={3} scale-y={3} rotation-y={0}>
        <primitive object={nodes.Xmcp_1} material={shaderMaterial} />
        <primitive object={nodes.Xmcp_2} material={shaderMaterial} />
      </group>
    </>
  )
}
