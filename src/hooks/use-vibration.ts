import { useEffect } from 'react'

export const useVibration = () => {
  useEffect(() => {
    /* ask for permission */
    navigator.vibrate(0)
  }, [])

  const vibrate = (pattern: number | number[]) => {
    if (!navigator.vibrate) return
    navigator.vibrate(pattern)
  }

  return vibrate
}
