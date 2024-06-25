/* wheel hook that receives a callback and passes the delta value */

import { useEffect, useRef } from 'react'

export const useWheel = (
  onChange: ({
    event,
    deltaY,
    deltaX
  }: {
    event: WheelEvent
    deltaY: number
    deltaX: number
  }) => void
) => {
  const onChangeRef = useRef(onChange)

  onChangeRef.current = onChange

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      onChangeRef.current?.({
        event,
        deltaY: event.deltaY,
        deltaX: event.deltaX
      })
    }

    window.addEventListener('wheel', handleWheel)

    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])
}
