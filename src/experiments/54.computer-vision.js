import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-converter'
import '@tensorflow-models/body-segmentation'

import { useGsapFrame } from '@basementstudio/definitive-scroll/hooks'
import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import * as depthEstimation from '@tensorflow-models/depth-estimation'
import React, { useCallback, useEffect } from 'react'
import * as THREE from 'three'

import { HTMLLayout } from '~/components/layout/html-layout'

let estimator
let cachedData
const estimationConfig = {
  minDepth: 0, // The minimum depth value outputted by the estimator.
  maxDepth: 1 // The maximum depth value outputted by the estimator.
}

const format = {
  width: 640,
  height: 480
}

const DepthPlane = ({ canvasRef }) => {
  const meshRef = React.useRef()

  useFrame(() => {
    // Get texture from canvas & apply to plane displaceMap
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    const material = new THREE.DataTexture(
      imageData.data,
      canvas.width,
      canvas.height,
      THREE.RGBAFormat
    )

    meshRef.current.material.displacementMap = material
    meshRef.current.material.displacementMap.needsUpdate = true
    meshRef.current.material.displacementMap.flipY = true
    meshRef.current.material.displacementMap.flipX = true
    meshRef.current.material.displacementScale = 1

    meshRef.current.material.map = material
    meshRef.current.material.map.needsUpdate = true
    meshRef.current.material.map.flipY = true
    meshRef.current.material.map.flipX = true
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[5, 5 / (format.width / format.height), 60, 60]} />
      <meshStandardMaterial />
    </mesh>
  )
}

const ComputerVision = () => {
  const videoRef = React.useRef()
  const canvasRef = React.useRef()

  const createEstimator = useCallback(async () => {
    const model = depthEstimation.SupportedModels.ARPortraitDepth
    estimator = await depthEstimation.createEstimator(model)
  }, [])

  const getUserMedia = useCallback(async () => {
    const constraints = {
      audio: false,
      video: {
        facingMode: 'user',
        width: 640,
        height: 480
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    const video = videoRef.current
    video.srcObject = stream
    video.onloadedmetadata = () => {
      video.play()
    }
  }, [])

  useEffect(() => {
    getUserMedia().then(createEstimator)
  }, [getUserMedia, createEstimator])

  useGsapFrame(async () => {
    if (estimator) {
      if (cachedData) {
        cachedData.depthTensor.dispose()
      }

      const depth = await estimator.estimateDepth(
        videoRef.current,
        estimationConfig
      )

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      const canvasImage = await depth.toCanvasImageSource()
      ctx.drawImage(canvasImage, 0, 0, canvas.width, canvas.height)

      cachedData = depth
    }
  }, [estimator])

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <div style={{ gridColumn: '2 / span 2' }}>
          <video
            style={{
              transform: 'scaleX(-1)',
              aspectRatio: format.width / format.height
            }}
            id="user-video"
            ref={videoRef}
          />
        </div>
        <div style={{ gridColumn: '4 / span 2' }}>
          <canvas
            style={{
              transform: 'scaleX(-1)',
              width: '100%',
              aspectRatio: format.width / format.height
            }}
            id="output"
            ref={canvasRef}
          />
        </div>
        <div
          style={{
            gridColumn: '3 / span 2'
          }}
        >
          <Canvas
            style={{ width: '100%', aspectRatio: format.width / format.height }}
          >
            <ambientLight intensity={0.5} />
            <color attach="background" args={['#00f']} />
            <OrbitControls />
            <DepthPlane canvasRef={canvasRef} />
          </Canvas>
        </div>
      </div>
    </>
  )
}

export const title = 'Computer Vision'
ComputerVision.Layout = HTMLLayout

export default ComputerVision
