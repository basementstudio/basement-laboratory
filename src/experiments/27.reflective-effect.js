import { useGsapFrame } from '@basementstudio/definitive-scroll/hooks'
import { useCallback, useEffect, useState } from 'react'

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

const ReflectiveEffect = () => {
  const [orientation, setOrientation] = useState({
    x: 0,
    y: 0,
    normalized: { x: 0, y: 0 }
  })
  const { normalized } = useMouse()
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
        x: (mobileX / 180) * 2 - 1,
        y: -(mobileY / 90) * 2 + 1
      }
    })
  })

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        backgroundImage: `conic-gradient(from ${
          isDesktop
            ? 360 * 0.5 * (normalized.x + normalized.y)
            : 360 * (orientation.normalized.x + orientation.normalized.y)
        }deg at 50% 50%, #438D01 -33.51deg, #E2BF7B 147.65deg, #438D01 240deg, #438D01 326.49deg, #E2BF7B 507.65deg)`,
        backgroundRepeat: 'repeat',
        backgroundSize: '30px 30px',
        backgroundPositionX: '50%',
        backgroundPositionY: '50%'
      }}
    >
      {!isDesktop && (
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
          <div>normalized x: {orientation.normalized.x.toFixed(4)}</div>
          <div>normalized y: {orientation.normalized.y.toFixed(4)}</div>
        </div>
      )}

      {!initialized && !isDesktop && (
        <div
          onTouchStart={handleOverlayTap}
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
ReflectiveEffect.Title = 'Reflective Effect'

export default ReflectiveEffect
