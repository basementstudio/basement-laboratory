import { useState } from 'react'

export const useMobileDeviceOrientation = () => {
  const [orientation, setOrientation] = useState<{
    x: number | null
    y: number | null
  }>({
    x: 0,
    y: 0
  })

  const handleOrientation = (e: DeviceOrientationEvent) => {
    setOrientation({ x: e.beta, y: e.gamma })
  }

  const requestAccessAsync = async (): Promise<boolean> => {
    if (!DeviceOrientationEvent) {
      console.error(
        new Error('Device orientation event is not supported by your browser')
      )
      return false
    }

    if (
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      let permission: PermissionState
      try {
        permission = await (DeviceOrientationEvent as any).requestPermission()
      } catch (err) {
        console.error(err)
        return false
      }
      if (permission !== 'granted') {
        console.error('Request to access the device orientation was rejected')
        return false
      }
    }

    window.addEventListener('deviceorientation', handleOrientation)
    return true
  }

  return { mobileX: orientation.x, mobileY: orientation.y, requestAccessAsync }
}
