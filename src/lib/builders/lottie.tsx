import { button, useControls } from 'leva'
import Lottie, { AnimationItem } from 'lottie-web'
import { FC, useEffect, useRef } from 'react'

export const lottie = (path: string): FC => {
  return () => {
    const containerRef = useRef(null)
    const animation = useRef<AnimationItem>()
    useControls({
      'play/pause': button(() => {
        if (animation.current?.isPaused) {
          animation.current?.play()
        } else {
          animation.current?.pause()
        }
      })
    })

    useEffect(() => {
      if (!containerRef.current) return

      let _animation: AnimationItem | undefined

      import(`/public/lotties/${path}`).then((lottie) => {
        animation.current = Lottie.loadAnimation({
          container: containerRef.current!,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: lottie
        })

        _animation = animation.current
      })

      return () => {
        _animation?.destroy()
      }
    }, [])

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw'
        }}
      >
        <div style={{ width: '40vw', height: '40vh' }} ref={containerRef} />
      </div>
    )
  }
}
