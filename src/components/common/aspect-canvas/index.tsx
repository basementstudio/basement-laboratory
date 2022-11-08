import { createRoot, events, extend, RenderProps } from '@react-three/fiber'
import { FC, useEffect, useRef } from 'react'
import * as THREE from 'three'

import { AspectBox } from '~/components/layout/aspect-box'

extend(THREE)

export const AspectCanvas: FC<{
  config: RenderProps<never> | undefined
  aspect: number
}> = ({ children, config, aspect }) => {
  const canvasRef = useRef(null)
  const aspectBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !aspectBoxRef.current) return

    const root = createRoot(canvasRef.current)

    root.configure({
      events,
      ...config
    })

    window.addEventListener('resize', () => {
      if (!aspectBoxRef.current) return

      root.configure({
        size: {
          width: aspectBoxRef.current.clientWidth,
          height: aspectBoxRef.current.clientHeight,
          left: 0,
          top: 0
        },
        ...config
      })
    })

    window.dispatchEvent(new Event('resize'))

    root.render(children)

    return root.unmount
  }, [config])

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center'
      }}
    >
      <AspectBox
        style={{ position: 'relative', width: '100%' }}
        ratio={aspect}
        ref={aspectBoxRef}
      >
        <canvas style={{ position: 'absolute', inset: 0 }} ref={canvasRef} />
      </AspectBox>
    </div>
  )
}
