import { useGsapFrame } from '@basementstudio/definitive-scroll/hooks'
import { useEffect, useState } from 'react'

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
  const [angle, setAngle] = useState(0)
  const { normalized } = useMouse()
  const { isDesktop } = useDeviceDetect()
  const { mobileX, mobileY, requestAccessAsync } = useMobileDeviceOrientation()

  useEffect(() => {
    window.addEventListener('click', requestAccessAsync, {passive: true})

    return () => window.removeEventListener('click', requestAccessAsync)
  }, [requestAccessAsync])

  useGsapFrame(() => {
    // console.log({ mobileX, mobileY })

    if (mobileX === undefined || mobileY === undefined) return

    setAngle(mobileX)
  }, [])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundImage: `conic-gradient(from ${
          isDesktop ? 360 * (normalized.x + normalized.y) : angle
        }deg at 50% 50%, #438D01 -33.51deg, #E2BF7B 147.65deg, #438D01 240deg, #438D01 326.49deg, #E2BF7B 507.65deg)`,
        backgroundRepeat: 'repeat',
        backgroundSize: '30px 30px',
        backgroundPositionX: '50%',
        backgroundPositionY: '50%'
      }}
    ></div>
  )
}

ReflectiveEffect.Layout = SmoothScrollLayout
ReflectiveEffect.Title = 'Reflective Effect'

export default ReflectiveEffect
