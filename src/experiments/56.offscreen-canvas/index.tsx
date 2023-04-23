import { Canvas } from '@react-three/offscreen'
import Lenis from '@studio-freight/lenis'
import {
  forwardRef,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'

import { HTMLLayout } from '~/components/layout/html-layout'

import { useMessageManager } from './hooks'

const R3FWorkerProxy = forwardRef<any, { worker: Worker; targetName: string }>(
  ({ worker, targetName }, ref) => {
    const message = useMessageManager(worker)

    const set = useCallback(
      (path: string, value: any) => {
        message({
          type: 'set',
          payload: {
            target: targetName,
            path,
            value
          }
        })
      },
      [message, targetName]
    )

    useImperativeHandle(
      ref,
      () => {
        return {
          set: (path: string, value: any) => {
            set(path, value)
          }
        }
      },
      [set]
    )

    return <></>
  }
)

const R3FWorkerScrollProxy = ({
  worker,
  targetName,
  track
}: {
  worker: Worker
  targetName: string
  track: RefObject<HTMLElement>
}) => {
  const message = useMessageManager(worker)

  useEffect(() => {
    if (!track.current) return

    const update = () => {
      if (!track.current) return

      const bounds = track.current.getBoundingClientRect()

      message({
        type: 'scroll-track',
        payload: {
          target: targetName,
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

    update()

    const observer = new ResizeObserver(update)

    observer.observe(track.current)

    return () => {
      observer.disconnect()
    }
  }, [message, track, targetName])

  return <></>
}

const OffscreenCanvas = () => {
  const divRef = useRef<HTMLDivElement>(null)
  const [worker] = useState(
    () => new Worker(new URL('./worker', import.meta.url))
  )
  const mesh2Ref = useRef<any>(null)

  useEffect(() => {
    if (!mesh2Ref.current) return

    mesh2Ref.current.set('material.wireframe', true)

    let acum = 0

    const id = setInterval(() => {
      acum += 0.01
      mesh2Ref.current.set('rotation.y', acum)
      mesh2Ref.current.set('rotation.x', acum)
    }, 10)

    return () => {
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!divRef.current) return

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

      <R3FWorkerScrollProxy
        worker={worker}
        targetName="scroll-mesh"
        track={divRef}
      />
      <R3FWorkerProxy worker={worker} targetName="rotate-mesh" ref={mesh2Ref} />
    </>
  )
}

OffscreenCanvas.Title = 'Offscreen Canvas'
OffscreenCanvas.Layout = HTMLLayout

export default OffscreenCanvas
