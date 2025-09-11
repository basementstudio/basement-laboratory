import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  ChromaticAberration,
  EffectComposer,
  wrapEffect
} from '@react-three/postprocessing'
import { folder, useControls } from 'leva'
import { Effect } from 'postprocessing'
import { useCallback, useRef } from 'react'
import * as THREE from 'three'

import { fragment } from '../shaders/shaders'

class CrtEffectImpl extends Effect {
  constructor() {
    super('CrtEffect', fragment, {
      uniforms: new Map<
        string,
        THREE.Uniform<number | boolean | THREE.Vector3>
      >([
        ['uColorNum', new THREE.Uniform(4.0)],
        ['uPixelSize', new THREE.Uniform(4.0)],
        ['uThresholdOffset', new THREE.Uniform(8)],
        ['uTime', new THREE.Uniform(0)],
        ['uNoiseIntensity', new THREE.Uniform(0.0)],
        ['uWarpStrength', new THREE.Uniform(0.75)],
        ['uScanlineIntensity', new THREE.Uniform(0.25)],
        ['uScanlineFrequency', new THREE.Uniform(1024.0)],
        ['uIsMonochrome', new THREE.Uniform(false)],
        [
          'uMonochromeColor',
          new THREE.Uniform(new THREE.Vector3(1.0, 0.5, 0.0))
        ]
      ])
    })
  }

  update(renderer: any, inputBuffer: any, deltaTime: number) {
    // @ts-expect-error
    this.uniforms.get('uTime').value += deltaTime
  }
}

export const CrtEffect = wrapEffect(CrtEffectImpl)

export function Scene() {
  const crtEffect = useRef<CrtEffectImpl>(null)
  const { scene } = useGLTF('/models/monitor.glb')

  const {
    colorNum,
    pixelSize,
    thresholdOffset,
    isMonochrome,
    monochromeColor,
    noiseIntensity,
    warpStrength,
    scanlineIntensity,
    scanlineFrequency
  } = useControls({
    Pixelation: folder({
      colorNum: {
        value: 2.0,
        min: 2.0,
        max: 8.0,
        step: 1.0,
        label: 'Color Numbers'
      },
      pixelSize: {
        value: 3.0,
        min: 1.0,
        max: 16.0,
        step: 1.0,
        label: 'Pixel Size'
      },
      thresholdOffset: {
        value: 8,
        min: 0,
        max: 16.0,
        step: 1.0,
        label: 'Threshold Offset'
      }
    }),

    'CRT Effects': folder({
      noiseIntensity: {
        value: 0.15,
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Noise Intensity'
      },
      warpStrength: {
        value: 0.75,
        min: 0,
        max: 2,
        step: 0.01,
        label: 'Screen Warp'
      }
    }),

    Scanlines: folder({
      scanlineIntensity: {
        value: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Intensity'
      },
      scanlineFrequency: {
        value: 1024,
        min: 100,
        max: 2048,
        step: 1,
        label: 'Frequency'
      }
    }),

    'Color Mode': folder({
      isMonochrome: {
        value: false,
        label: 'Monochrome'
      },
      monochromeColor: {
        value: '#ff8000',
        render: (get) => get('Color Mode.isMonochrome'),
        label: 'Color'
      }
    })
  })

  const updateUniforms = useCallback(() => {
    if (!crtEffect.current) return

    const uniforms = crtEffect.current.uniforms
    // @ts-expect-error
    uniforms.get('uColorNum').value = colorNum
    // @ts-expect-error
    uniforms.get('uPixelSize').value = pixelSize
    // @ts-expect-error
    uniforms.get('uThresholdOffset').value = thresholdOffset
    // @ts-expect-error
    uniforms.get('uIsMonochrome').value = isMonochrome
    // @ts-expect-error
    uniforms.get('uNoiseIntensity').value = noiseIntensity
    // @ts-expect-error
    uniforms.get('uWarpStrength').value = warpStrength
    // @ts-expect-error
    uniforms.get('uScanlineIntensity').value = scanlineIntensity
    // @ts-expect-error
    uniforms.get('uScanlineFrequency').value = scanlineFrequency

    const color = new THREE.Color(monochromeColor)
    // @ts-expect-error
    uniforms.get('uMonochromeColor').value.set(color.r, color.g, color.b)
  }, [
    colorNum,
    pixelSize,
    thresholdOffset,
    isMonochrome,
    noiseIntensity,
    warpStrength,
    scanlineIntensity,
    scanlineFrequency,
    monochromeColor
  ])

  useFrame(() => {
    updateUniforms()
  })

  return (
    <>
      <OrbitControls />

      <PerspectiveCamera makeDefault position={[1, 1, 2]} fov={65} />

      <ambientLight intensity={1} />
      <directionalLight position={10} intensity={3} />

      <primitive object={scene} position={[0, -0.5, 0]} />

      <EffectComposer>
        {/* @ts-expect-error */}
        <ChromaticAberration offset={[0.0025, 0.0025]} />
        {/* @ts-expect-error */}
        <CrtEffect ref={crtEffect} />
      </EffectComposer>
    </>
  )
}
