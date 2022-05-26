import { useGsapFrame } from '@basementstudio/definitive-scroll/hooks'
import React, { useEffect, useRef } from 'react'

import { SmoothScrollLayout } from '../components/layout/smooth-scroll-layout'
import { range } from '../lib/utils'

const ImagePortal = () => {
  const firstPickRef = useRef()
  const secondPickRef = useRef()
  const sectionRef = useRef()

  useEffect(() => {
    document.documentElement.classList.add('hide-scroll')

    return () => {
      document.documentElement.classList.remove('hide-scroll')
    }
  }, [])

  useGsapFrame(() => {
    if (
      !secondPickRef.current ||
      !firstPickRef.current ||
      !sectionRef.current
    ) {
      return
    }

    const divisor = sectionRef.current.clientHeight / window.innerHeight

    firstPickRef.current.style.transform = `translateY(${
      -window.scrollY / divisor
    }px)`
    firstPickRef.current.style.transformStyle = 'preserve-3d'
    secondPickRef.current.style.transform = `translateY(${
      -window.scrollY / divisor
    }px)`
    secondPickRef.current.style.transformStyle = 'preserve-3d'
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '200vw',
        overflow: 'hidden'
      }}
      ref={sectionRef}
    >
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          minHeight: '100vh'
        }}
      >
        <img
          style={{ position: 'relative', willChange: 'transform' }}
          src="/images/misho-jb.jpg"
          ref={firstPickRef}
        />
      </div>

      <div style={{ position: 'absolute', inset: '0', zIndex: 1 }}>
        {range(16).map((i) => (
          <h1
            style={{
              fontSize: '6.5vw',
              textAlign: 'center',
              fontFamily: 'Basement Grotesque Display',
              marginTop: '4.5vh'
            }}
            key={i}
          >
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
              width: '100vw',
              minHeight: '100vh',
              zIndex: 1,
              overflow: 'hidden'
            }}
          >
            <img
              style={{
                position: 'absolute',
                inset: 0,
                width: '100vw'
              }}
              src="/images/misho-jb.jpg"
              ref={secondPickRef}
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
