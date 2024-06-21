import { easing } from 'maath'
import { useEffect, useMemo, useRef } from 'react'

export const useLerpRef = (
  initialValue: number,
  config: {
    lerp: number
    tickThreshold?: number
    onTick?: (current: number) => void
  }
) => {
  const target = useRef(initialValue)
  const current = useRef(initialValue)
  const onTickRef = useRef(config.onTick)

  onTickRef.current = config.onTick

  useEffect(() => {
    let lastTime = 0
    let frameId: number

    const update = (time: number) => {
      const deltaTime = time - lastTime

      lastTime = time

      easing.damp(
        current,
        'current',
        target.current,
        config.lerp,
        deltaTime / 1000
      )

      if (config.tickThreshold) {
        const diff = Math.abs(current.current - target.current)
        if (diff > config.tickThreshold) {
          onTickRef.current?.(current.current)
        }
      } else {
        onTickRef.current?.(current.current)
      }

      frameId = requestAnimationFrame(update)
    }

    frameId = requestAnimationFrame(update)

    return () => {
      frameId && cancelAnimationFrame(frameId)
    }
  }, [config.lerp, config.tickThreshold])

  return useMemo(
    () => ({
      current,
      target
    }),
    []
  )
}
