import { useGsapFrame } from '@basementstudio/definitive-scroll/hooks'
import React, { useRef } from 'react'
import useMeasure from 'react-use-measure'

import { SmoothScrollLayout } from '../components/layout/smooth-scroll-layout'
import { range } from '../lib/utils'

const ImagePortal = () => {
  const imageRef = useRef()
  const [ref, bounds] = useMeasure()

  useGsapFrame(() => {
    if (!imageRef.current) return

    imageRef.current.style.transform = `translateY(${-window.scroller
      .scrollPos}px)`
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }} ref={ref}>
      <img src="/images/misho-jb.jpg" />

      <div style={{ position: 'absolute', inset: '0', zIndex: 1 }}>
        {range(8).map((i) => (
          <h1 style={{ fontSize: '10vw', textAlign: 'center' }} key={i}>
            OMG! A PORTAL
          </h1>
        ))}
      </div>

      <div
        style={{
          width: '40vw',
          height: '70vh',
          position: 'fixed',
          zIndex: 3,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            display: 'block',
            overflow: 'hidden',
            width: '100%',
            height: '100%'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '-30vw',
              top: '-15vh',
              width: bounds.width,
              height: '100%',
              minHeight: '100vh',
              zIndex: 1,
              overflow: 'hidden'
            }}
          >
            <img
              style={{
                position: 'absolute',
                inset: 0
              }}
              src="/images/misho-jb.jpg"
              ref={imageRef}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

ImagePortal.Layout = SmoothScrollLayout
ImagePortal.Title = 'Image Portal'

export default ImagePortal
