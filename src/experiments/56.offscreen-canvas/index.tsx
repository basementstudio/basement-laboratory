import { Canvas } from '@react-three/offscreen'
import Lenis from '@studio-freight/lenis'
import { useEffect, useRef, useState } from 'react'

import { HTMLLayout } from '~/components/layout/html-layout'

const OffscreenCanvas = () => {
  const divRef = useRef<HTMLDivElement>(null)
  const [worker] = useState(
    () => new Worker(new URL('./worker', import.meta.url))
  )

  useEffect(() => {
    if (!divRef.current) return

    const bounds = divRef.current.getBoundingClientRect()

    const lenis = new Lenis({
      smoothWheel: true
    })

    lenis.on('scroll', (event: any) => {
      worker.postMessage({
        type: 'scroll',
        payload: {
          scrollTop: event.scroll
        }
      })
    })

    const raf: FrameRequestCallback = (time) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    const lenisUpd = requestAnimationFrame(raf)

    worker.addEventListener('message', (event) => {
      if (event.data.type === 'ready') {
        worker.postMessage({
          type: 'mesh-update',
          payload: {
            target: 'my-mesh',
            bounds: {
              bottom: bounds.bottom,
              top: bounds.top,
              left: bounds.left,
              right: bounds.right,
              width: bounds.width,
              height: bounds.height
            }
          }
        })
      }
    })

    return () => {
      lenisUpd && cancelAnimationFrame(lenisUpd)
      lenis.destroy()
      worker.terminate()
    }
  }, [worker])

  return (
    <>
      <div
        style={{
          position: 'fixed',
          width: '100%',
          height: '100vh',
          zIndex: -1
        }}
      >
        <Canvas camera={{ position: [0, 0, 20], fov: 45 }} worker={worker} />
      </div>

      <div
        style={{
          height: '200vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div
          style={{ width: 300, height: 300, border: '1px solid red' }}
          ref={divRef}
        />
      </div>
    </>
  )
}

OffscreenCanvas.Title = 'Offscreen Canvas'
OffscreenCanvas.Layout = HTMLLayout

export default OffscreenCanvas
