import React, { useEffect, useRef, useState } from 'react'

import { useDeviceDetect } from '~/hooks/use-device-detect'
import { useGsapContext } from '~/hooks/use-gsap-context'
import { gsap } from '~/lib/gsap'

import { SmoothScrollLayout } from '../components/layout/smooth-scroll-layout'

const FOOTER_PROGRESS_HEIGHT = 4

const FooterTrigger = () => {
  const [progressVisible, setProgressVisible] = useState(true)
  const previousValuesRef = useRef()
  const footerRef = useRef(null)
  const progressRef = useRef(null)
  const footerFrameRef = useRef(null)

  const { isDesktop } = useDeviceDetect()

  useEffect(() => {
    if (!footerRef.current) return
    const { previousSibling } = footerRef.current
    if (!(previousSibling instanceof HTMLElement)) return

    if (isDesktop) {
      const handleResize = () => {
        if (!footerRef.current) return
        const elementHeight = previousSibling.offsetHeight
        const offset = window.innerHeight - elementHeight

        previousValuesRef.current = {
          position: previousSibling.style.position,
          top: previousSibling.style.top
        }

        previousSibling.style.zIndex = '-1'
        previousSibling.style.position = 'sticky'
        previousSibling.style.top = offset + 'px'
      }

      handleResize()
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    } else {
      return () => {
        if (previousValuesRef.current) {
          previousSibling.style.position = previousValuesRef.current.position
          previousSibling.style.top = previousValuesRef.current.top
        }
      }
    }
  }, [footerRef, isDesktop])

  useGsapContext(() => {
    const { height } = footerRef.current.getBoundingClientRect()

    const footerTween = gsap.fromTo(
      footerFrameRef.current,
      { translateY: '100%' },
      {
        translateY: '0%',
        duration: 0.5,
        paused: true,
        ease: 'power2.inOut',
        onReverseComplete: () => {
          setProgressVisible(true)
        }
      }
    )

    gsap.fromTo(
      progressRef.current.firstChild,
      {
        scaleX: '0%'
      },
      {
        scaleX: '100%',
        scrollTrigger: {
          scrub: 0.1,
          start: `top bottom-=${height / 4}px`,
          end: `top 100%-=${height}px`,
          trigger: footerRef.current,
          onLeave: () => {
            footerTween.play()
            setProgressVisible(false)
          },
          onEnterBack: () => {
            footerTween.reverse()
          }
        }
      }
    )
  }, [])

  return (
    <div style={{ fontSize: 24, fontWeight: 600 }}>
      <div>
        <div
          style={{
            height: '120vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {'<'}ScrollableContent {'/>'}
        </div>
      </div>
      <footer
        style={{
          marginBottom: 'auto',
          // Height is the duration in pixels of the trigger
          height: 600
        }}
        ref={footerRef}
      >
        <div
          style={{
            transform: `translateY(-${progressVisible ? 100 : 0}%)`,
            position: 'sticky',
            top: '100vh',
            marginBottom: -FOOTER_PROGRESS_HEIGHT
          }}
          ref={progressRef}
        >
          <span
            style={{
              transformOrigin: 'center left',
              display: 'block',
              height: FOOTER_PROGRESS_HEIGHT,
              background: '#E7AD19',
              width: '100%'
              // opacity: footerActive ? 0 : 1
            }}
          />
        </div>
        <div
          style={{
            borderTop: '1px solid white',
            // transition: 'transform 0.6s ease-out',
            position: 'fixed',
            height: '80vh',
            width: '100vw',
            display: 'flex',
            bottom: 0,
            // transform: `translateY(${footerActive ? 0 : 100}%)`,
            background: '#00000020',
            backdropFilter: 'blur(10px)',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          ref={footerFrameRef}
        >
          {'<'}Footer {'/>'}
        </div>
      </footer>
    </div>
  )
}

FooterTrigger.Title = 'Footer trigger'
FooterTrigger.Layout = SmoothScrollLayout

export default FooterTrigger
