import * as React from 'react'
import * as ReactDeviceDetect from 'react-device-detect'

type DD = {
  isMobile?: boolean
  isTablet?: boolean
  isDesktop?: boolean
  isMobileSafari?: boolean
  isMobileOnly?: boolean
  isSafari?: boolean
  isChrome?: boolean
  isFirefox?: boolean
  isMacOs?: boolean
  isWindows?: boolean
  isIOS?: boolean
  isAndroid?: boolean
  isBrowser?: boolean
  isTouch?: boolean
}

export const useDeviceDetect = () => {
  const [dd, set] = React.useState<DD>({})

  React.useEffect(() => {
    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0

    const isIpadPro =
      ReactDeviceDetect.isDesktop && ReactDeviceDetect.isSafari && isTouchDevice

    set({
      isDesktop: ReactDeviceDetect.isDesktop && !isIpadPro,
      isMobile: ReactDeviceDetect.isMobile || isIpadPro,
      isMobileOnly: ReactDeviceDetect.isMobileOnly,
      isMobileSafari: ReactDeviceDetect.isMobileSafari,
      isTablet: ReactDeviceDetect.isTablet || isIpadPro,
      isChrome: ReactDeviceDetect.isChrome,
      isFirefox: ReactDeviceDetect.isFirefox,
      isSafari: ReactDeviceDetect.isSafari,
      isMacOs: ReactDeviceDetect.isMacOs,
      isWindows: ReactDeviceDetect.isWindows,
      isIOS: ReactDeviceDetect.isIOS,
      isAndroid: ReactDeviceDetect.isAndroid,
      isBrowser: ReactDeviceDetect.isBrowser,
      isTouch: isTouchDevice
    })
  }, [])

  return dd
}
