import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import React, { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { folder, useControls } from 'leva'

type Variation = {
  sizeMultiplier: number
  opacityMultiplier: number
  yOffset: number
  rotationOffset: number
}

type CreateInstancesProps = {
  count: number
  radius: number
  fontSize: number
  variations: Variation[]
  verticalOffset: number
  color: string
  isRandomVariation: boolean
  rotationX: number
  rotationY: number
  rotationZ: number
  spiralTurns: number
  spiralDirection: number
  minY: number
  maxY: number
  textContent: string
}

const createInstances = ({
  count,
  radius,
  fontSize,
  variations,
  verticalOffset,
  color,
  isRandomVariation,
  rotationX,
  rotationY,
  rotationZ,
  spiralTurns,
  spiralDirection,
  minY,
  maxY,
  textContent
}: CreateInstancesProps) => {
  const textInstances: React.JSX.Element[] = []

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    const progressRatio = i / count
    const spiralY = minY + progressRatio * (maxY - minY)
    const helixOffset =
      Math.sin(progressRatio * spiralTurns * Math.PI * 2 * spiralDirection) *
      0.2

    const variation = isRandomVariation ? variations[i] || variations[0] : null
    const finalFontSize = variation
      ? fontSize * variation.sizeMultiplier
      : fontSize

    const finalY =
      verticalOffset +
      spiralY +
      helixOffset +
      (variation ? variation.yOffset * 0.1 : 0)

    textInstances.push(
      <Text
        key={i}
        font="/fonts/adhesion/Adhesion-Regular.woff"
        fontSize={finalFontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        position={[x, finalY, z]}
        rotation={[
          rotationX,
          -angle +
            Math.PI / 2 +
            (variation ? variation.rotationOffset : 0) +
            rotationY,
          rotationZ
        ]}
        letterSpacing={0.1}
      >
        {textContent}
      </Text>
    )
  }

  return textInstances
}

const circularPreset = {
  radius: 1.6,
  count: 30,
  fontSize: 0.15,
  opacity: 0.05,
  rotationSpeed: 0.2,
  verticalOffset: -4.1,
  variation: false,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  spiralHeight: 0.0,
  spiralTurns: 0.5,
  spiralDirection: 1,
  minY: 2.6,
  maxY: 2.6,
  color: '#fff  '
}

const spiralPreset = {
  count: 46,
  radius: 1.9,
  fontSize: 0.15,
  opacity: 0.05,
  rotationSpeed: 0.5,
  verticalOffset: -0.5,
  variation: false,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 45,
  spiralHeight: 1.5,
  spiralTurns: 1.2,
  spiralDirection: 1,
  minY: 1.3,
  maxY: -0.4,
  color: '#383838'
}

export default function CircularTextSpell({
  presetProps = 'spiral',
  textContent = 'Ship'
}: {
  presetProps: 'spiral' | 'circular'
  textContent: string
}) {
  const groupRef = useRef<THREE.Group>(null)

  const preset = presetProps === 'spiral' ? spiralPreset : circularPreset

  const controls = useControls({
    [presetProps + ' Text']: folder({
      color: {
        value: preset.color,
        label: 'Color'
      },
      radius: {
        value: preset.radius,
        min: 0,
        max: 20,
        step: 0.1
      },
      count: {
        value: preset.count,
        min: 1,
        max: 100,
        step: 1
      },
      fontSize: {
        value: preset.fontSize,
        min: 0.1,
        max: 1,
        step: 0.05
      },
      opacity: {
        value: preset.opacity,
        min: 0,
        max: 1,
        step: 0.01
      },
      rotationSpeed: {
        value: preset.rotationSpeed,
        min: -2,
        max: 2,
        step: 0.1
      },
      verticalOffset: {
        value: preset.verticalOffset,
        min: -5,
        max: 5,
        step: 0.1
      },
      variation: {
        value: false,
        label: 'Add Variation'
      },
      rotationX: {
        value: preset.rotationX,
        min: -180,
        max: 180,
        step: 1
      },
      rotationY: {
        value: preset.rotationY,
        min: -180,
        max: 180,
        step: 1
      },
      rotationZ: {
        value: preset.rotationZ,
        min: -180,
        max: 180,
        step: 1
      },
      spiralHeight: {
        value: preset.spiralHeight,
        min: 0,
        max: 10,
        step: 0.1,
        label: 'Spiral Height'
      },
      spiralTurns: {
        value: preset.spiralTurns,
        min: 0,
        max: 5,
        step: 0.1,
        label: 'Spiral Turns'
      },
      spiralDirection: {
        value: preset.spiralDirection,
        min: -1,
        max: 1,
        step: 0.2,
        label: 'Spiral Direction'
      },
      minY: {
        value: preset.minY,
        min: -10,
        max: 10,
        step: 0.1,
        label: 'Min Y Position'
      },
      maxY: {
        value: preset.maxY,
        min: -10,
        max: 10,
        step: 0.1,
        label: 'Max Y Position'
      }
    })
  })

  const variations: Variation[] = useMemo(() => {
    return Array.from({ length: controls.count }, () => ({
      sizeMultiplier: 0.8 + Math.random() * 0.4,
      opacityMultiplier: 0.7 + Math.random() * 0.6,
      yOffset: (Math.random() - 0.5) * 3,
      rotationOffset: (Math.random() - 0.5) * 0.2
    }))
  }, [])

  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += Math.sin(controls.rotationSpeed * 0.01)
  })

  const textInstances = createInstances({
    count: controls.count,
    radius: controls.radius,
    fontSize: controls.fontSize,
    variations,
    verticalOffset: controls.verticalOffset,
    color: controls.color,
    isRandomVariation: controls.variation,
    rotationX: controls.rotationX,
    rotationY: controls.rotationY,
    rotationZ: controls.rotationZ,
    spiralTurns: controls.spiralTurns,
    spiralDirection: controls.spiralDirection,
    minY: controls.minY,
    maxY: controls.maxY,
    textContent: textContent
  })

  return <group ref={groupRef}>{textInstances}</group>
}
