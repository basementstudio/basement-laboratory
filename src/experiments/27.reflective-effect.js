import { useGsapFrame } from '@basementstudio/definitive-scroll/hooks'
import { useCallback, useEffect, useState } from 'react'
import { radToDeg } from 'three/src/math/MathUtils'

import { SmoothScrollLayout } from '../components/layout/smooth-scroll-layout'
import { useDeviceDetect } from '../hooks/use-device-detect'
import { useMobileDeviceOrientation } from '../hooks/use-mobile-orientation'
import { useViewportSize } from '../hooks/use-viewport'

const useMouse = () => {
  const [mousePos, setMousePos] = useState({ x: undefined, y: undefined })
  const { width, height } = useViewportSize()

  useEffect(() => {
    const updatePos = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', updatePos)

    return () => {
      window.removeEventListener('mousemove', updatePos)
    }
  }, [])

  return {
    ...mousePos,
    normalized: {
      x: (mousePos.x / width) * 2 - 1,
      y: -(mousePos.y / height) * 2 + 1
    }
  }
}

const calculateRad = (normalizedX, normalizedY) => {
  let offset = 0

  if (normalizedX > 0 && normalizedY > 0) {
    // Quandrant 1
    offset = 0
  }

  if (normalizedX < 0 && normalizedY > 0) {
    // Quandrant 2
    offset = Math.PI
  }

  if (normalizedX < 0 && normalizedY < 0) {
    // Quandrant 3
    offset = Math.PI
  }

  if (normalizedX > 0 && normalizedY < 0) {
    // Quandrant 4
    offset = 2 * Math.PI
  }

  return offset + Math.atan(normalizedY / normalizedX)
}

const ReflectiveEffect = () => {
  const [orientation, setOrientation] = useState({
    x: 0,
    y: 0,
    normalized: { x: 0, y: 0 }
  })
  const mouse = useMouse()
  const { isDesktop } = useDeviceDetect()
  const { mobileX, mobileY, requestAccessAsync } = useMobileDeviceOrientation()
  const [initialized, setInitialized] = useState(false)

  const handleOverlayTap = useCallback(() => {
    requestAccessAsync()
    setInitialized(true)
  }, [setInitialized, requestAccessAsync])

  useGsapFrame(() => {
    setOrientation({
      x: mobileX,
      y: mobileY,
      normalized: {
        x: mobileX / 90, // Range -180 to 180
        y: mobileY / 90 // Range -90 to 90
      }
    })
  })

  const mouseDeg = radToDeg(
    calculateRad(mouse.normalized.x, mouse.normalized.y)
  )
  const orientationDeg = radToDeg(
    calculateRad(orientation.normalized.x, orientation.normalized.y)
  )

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        backgroundImage: `conic-gradient(from ${
          isDesktop ? -mouseDeg : -orientationDeg
        }deg at 50% 50%, #E2BF7B -25.01deg, #438D01 25.09deg, #438D01 65.02deg, #E2BF7B 114.88deg, #E2BF7B 154.81deg, #438D01 204.9deg, #438D01 244.79deg, #E2BF7B 295.11deg, #E2BF7B 334.99deg, #438D01 385.09deg)`,
        backgroundRepeat: 'repeat',
        backgroundSize: '50px 50px',
        backgroundPositionX: '50%',
        backgroundPositionY: '50%'
      }}
    >
      {isDesktop ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'black'
          }}
        >
          <div>x: {Math.round(mouse.x)}</div>
          <div>y: {Math.round(mouse.y)}</div>
          <div>normalized x: {mouse.normalized.x.toFixed(2)}</div>
          <div>normalized y: {mouse.normalized.y.toFixed(2)}</div>
          <div>deg: {mouseDeg.toFixed(2)}</div>
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'black'
          }}
        >
          <div>x: {Math.round(orientation.x)}</div>
          <div>y: {Math.round(orientation.y)}</div>
          <div>normalized x: {orientation.normalized.x.toFixed(2)}</div>
          <div>normalized y: {orientation.normalized.y.toFixed(2)}</div>
          <div>deg: {orientationDeg.toFixed(2)}</div>
        </div>
      )}

      {!initialized && !isDesktop && (
        <div
          onClick={handleOverlayTap}
          style={{
            position: 'fixed',
            width: '100%',
            height: '100%',
            zIndex: 10,
            background: '#000000DD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Tap to start
        </div>
      )}
    </div>
  )
}

ReflectiveEffect.Layout = SmoothScrollLayout
export const title = 'Reflective Effect'

export default ReflectiveEffect
