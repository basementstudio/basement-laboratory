import {
  OrbitControls,
  PerspectiveCamera,
  PresentationControls,
  useVideoTexture
} from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { range } from 'lodash'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

import { CamTargetRotation } from '~/components/common/cam-target-rotation'
import { gsap } from '~/lib/gsap'

const LayeredVideo = () => {
  const lockRotation = useRef()
  const groupRef = useRef()
  const videoTexture = useVideoTexture('/video/nike-reel.mp4', {
    // start: false,
    // currentTime: 1
  })

  const planeCount = 15
  const distance = 0.05
  const aspect = 1920 / 1080

  const planes = useMemo(() => {
    const uniforms = range(planeCount).map(() => ({ value: 1 }))

    const duration = 2
    // const tl = gsap.timeline({ repeat: -1, repeatDelay: -2, yoyo: false })

    uniforms.forEach((u, i) => {
      gsap.to(u, {
        ease: 'none',
        keyframes: {
          '0%': { value: 1 },
          '50%': { value: 0 },
          '100%': { value: 1 }
        },
        duration: 2,
        repeat: -1,
        delay: () => i * (duration / planeCount)
      })
    })

    const patch = (idx) => (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_pars_fragment>`,
        `
          #include <dithering_pars_fragment>

          uniform float uAlpha;
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_fragment>`,
        `
          #include <dithering_fragment>

          float byColorAlpha = step(
            0.75,
            1.0 - (gl_FragColor.r + gl_FragColor.g + gl_FragColor.b) / 3.0
          );
          float alpha = max(byColorAlpha, uAlpha);

          gl_FragColor = vec4(
            gl_FragColor.rgb,
            min(alpha, 1.0)
          );
        `
      )

      shader.uniforms.uAlpha = uniforms[idx]
    }

    return Array(planeCount)
      .fill()
      .map((_, i) => {
        return (
          <mesh
            key={i}
            position={[0, 0, (planeCount / 2) * distance - i * distance]}
          >
            <planeBufferGeometry args={[1 * aspect, 1, 1, 1]} />
            <meshBasicMaterial
              onBeforeCompile={patch(i)}
              side={THREE.DoubleSide}
              map={videoTexture}
              transparent
              customProgramCacheKey={() => i}
              needsUpdate
            />
          </mesh>
        )
      })
  }, [videoTexture, aspect])

  useFrame(() => {
    if (lockRotation.current) return
    groupRef.current.rotation.y += 0.0035
  })

  const camPosition = new THREE.Vector3(0, 0, 3.5)

  return (
    <>
      {/* <gridHelper args={[10, 10]} />
      <axesHelper /> */}
      {/* <OrbitControls /> */}
      <CamTargetRotation
        initialCamPosition={camPosition}
        target={new THREE.Vector3(0, 0, 0)}
        rotationMultipliers={{ y: -0.1, x: 0 }}
      />
      <PresentationControls polar={[0, 0]} azimuth={[-Infinity, Infinity]}>
        <group
          onPointerDown={() => (lockRotation.current = true)}
          onPointerUp={() => (lockRotation.current = false)}
          ref={groupRef}
        >
          {planes}
        </group>
      </PresentationControls>
      <PerspectiveCamera makeDefault position={camPosition} fov={40} />
    </>
  )
}

LayeredVideo.Title = 'Layered Video'
LayeredVideo.Description = 'Test'

export default LayeredVideo
