import { useEffect, useRef, useState } from 'react'

export const useTrackDrag = ({
  onChange
}: {
  onChange: (params: { deltaX: number; deltaY: number }) => void
}) => {
  const internals = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0
  })
  const [isDragging, setIsDragging] = useState(false)

  const callbacks = useRef({ onChange })
  callbacks.current.onChange = onChange

  const onMouseMove = (e: DragEvent) => {
    if (!isDragging) return

    const { lastX, lastY } = internals.current
    const { clientX, clientY } = e

    const deltaX = clientX - lastX
    const deltaY = clientY - lastY

    internals.current.lastX = clientX
    internals.current.lastY = clientY

    callbacks.current.onChange({
      deltaX,
      deltaY
    })
  }

  const onMouseDown = (e: DragEvent) => {
    // e.preventDefault()
    const { clientX, clientY } = e

    console.log('onDragStart', clientX, clientY)

    internals.current.startX = clientX
    internals.current.startY = clientY
    internals.current.lastX = clientX
    internals.current.lastY = clientY

    setIsDragging(true)
  }

  const onMouseUp = () => {
    console.log('onDragEnd')
    setIsDragging(false)
  }

  return {
    listeners: {
      onMouseMove,
      onMouseDown,
      onMouseUp
    },
    isDragging
  }
}

const getPoint = (e: TouchEvent | DragEvent) => {
  const point = { x: 0, y: 0 }

  if (
    e.type === 'touchmove' ||
    e.type === 'touchstart' ||
    e.type === 'touchend'
  ) {
    const _e = e as TouchEvent
    const touch = _e.touches[0]
    point.x = touch.clientX
    point.y = touch.clientY
  } else if (
    e.type === 'mousemove' ||
    e.type === 'mousedown' ||
    e.type === 'mouseup'
  ) {
    const _e = e as DragEvent
    point.x = _e.clientX
    point.y = _e.clientY
  }

  return point
}

/*
  Implement inertia for the useTrackDrag hook: 
    - leverage requestAnimationFrame to calculate the inertia independently of the drag event.
    - it should accept a "onMotion" callback that executes a callback with the deltaX and deltaY.
    - it should accept a "weight" config param.
    - call it useTrackDragInertia.
    - you can re-implement the internals and callbacks refs.
    - use Date.now() to calculate the time difference between frames and velocity
*/
export const useTrackDragInertia = ({
  onMotion,
  weight = 0.95,
  inertiaThreshold = 0.001
}: {
  onMotion: (params: { deltaX: number; deltaY: number; }) => void
  weight?: number
  inertiaThreshold?: number
}) => {
  const internals = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    velocityX: 0,
    velocityY: 0,
    lastTime: 0
  })

  const [isDragging, setIsDragging] = useState(false)
  const [isInertia, setIsInertia] = useState(false)

  const callbacks = useRef({ onMotion })
  callbacks.current.onMotion = onMotion

  const onMouseOrTouchMove = (e: DragEvent | TouchEvent) => {
    if (!isDragging) return

    const { lastX, lastY } = internals.current
    const point = getPoint(e)
    const now = Date.now()
    const deltaTime = now - internals.current.lastTime

    const deltaX = point.x - lastX
    const deltaY = point.y - lastY

    internals.current.velocityX = deltaX / deltaTime
    internals.current.velocityY = deltaY / deltaTime

    if (
      Math.abs(internals.current.velocityX) === Infinity ||
      Math.abs(internals.current.velocityY) === Infinity
    ) {
      internals.current.velocityX = 0
      internals.current.velocityY = 0
    }

    internals.current.lastX = point.x
    internals.current.lastY = point.y
    internals.current.lastTime = now

    callbacks.current.onMotion({ deltaX, deltaY })
  }

  const onMouseOrTouchDown = (e: DragEvent | TouchEvent) => {
    e.preventDefault()

    const point = getPoint(e)

    internals.current.startX = point.x
    internals.current.startY = point.y
    internals.current.lastX = point.x
    internals.current.lastY = point.y
    internals.current.lastTime = Date.now()

    setIsDragging(true)
    setIsInertia(false)
  }

  const onMouseOrTouchUp = () => {
    setIsDragging(false)
    setIsInertia(true)
  }

  useEffect(() => {
    if (isInertia) {
      const applyInertia = () => {
        const { velocityX, velocityY } = internals.current
        internals.current.velocityX *= weight
        internals.current.velocityY *= weight

        const deltaX = internals.current.velocityX
        const deltaY = internals.current.velocityY

        callbacks.current.onMotion({ deltaX, deltaY })

        if (
          Math.abs(velocityX) > inertiaThreshold ||
          Math.abs(velocityY) > inertiaThreshold
        ) {
          requestAnimationFrame(applyInertia)
        } else {
          setIsInertia(false)
        }
      }

      requestAnimationFrame(applyInertia)
    }
  }, [inertiaThreshold, isInertia, weight])

  return {
    listeners: {
      onMouseMove: onMouseOrTouchMove,
      onMouseDown: onMouseOrTouchDown,
      onMouseUp: onMouseOrTouchUp,
      onTouchMove: onMouseOrTouchMove,
      onTouchStart: onMouseOrTouchDown,
      onTouchEnd: onMouseOrTouchUp
    },
    isDragging
  }
}
