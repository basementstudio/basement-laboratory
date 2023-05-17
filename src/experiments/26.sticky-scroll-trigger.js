import { useRef } from 'react'

import { AspectBox } from '../components/common/aspect-box'
import { SmoothScrollLayout } from '../components/layout/smooth-scroll-layout'
import { useGsapContext } from '../hooks/use-gsap-context'
import { useToggleState } from '../hooks/use-toggle-state'
import { gsap } from '../lib/gsap'
const SCROLL_TRIGGER_DURATION = 6000
const SCROLL_TRIGGER_PADDING = 800

const StickyScrollTrigger = () => {
  const { isOn: scrollTriggerActive, handleToggle } = useToggleState(true)
  const pinRef = useRef()
  const spacerRef = useRef()

  useGsapContext(() => {
    if (!pinRef.current || !spacerRef.current || !scrollTriggerActive) return

    gsap.set(spacerRef.current, { height: SCROLL_TRIGGER_DURATION })

    const pinSelector = gsap.utils.selector(pinRef.current)

    const { height } = pinRef.current.getBoundingClientRect()
    const trgt = pinSelector('#animate')

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: spacerRef.current,
        markers: true,
        // So it starts at the same time the pinnnig occurs, has to be in sync with...
        start: `top 50%-=${height / 2}px`,
        scrub: true,
        end: 'bottom bottom'
      }
    })

    gsap.set(pinRef.current, { top: `calc(50vh - ${height / 2}px)` }) // ...👈🏻 This one here
    gsap.set(spacerRef.current, { height: SCROLL_TRIGGER_DURATION })
    gsap.set(trgt, { minWidth: 2, minHeight: 2, top: 0, left: 0 })

    timeline.fromTo(trgt, { left: -2, width: '0%' }, { width: '100%' })
    timeline.to(trgt, { left: 'calc(100% - 2px)' }, '<+=35%')
    timeline.to(trgt, { height: '100%' })
    timeline.to(trgt, { top: 'calc(100% - 2px)' }, '<+=35%')
    timeline.to(trgt, { left: '0%' })
    timeline.to(trgt, { width: '2px' }, '<+=35%')
    timeline.to(trgt, { top: -2 })
    timeline.to(trgt, { height: '0' }, '<+=35%')
  }, [scrollTriggerActive])

  return (
    <div style={{ padding: `${SCROLL_TRIGGER_PADDING}px 0` }}>
      <div ref={spacerRef}>
        <AspectBox
          ratio={1920 / 1080}
          style={{
            position: 'sticky',
            width: '50%',
            margin: '0 auto',
            overflow: 'hidden'
          }}
          ref={pinRef}
        >
          <div
            style={{
              padding: 10,
              position: 'relative',
              width: '100%',
              height: '100%'
            }}
          >
            <div
              id="animate"
              style={{
                background: 'white',
                position: 'absolute'
              }}
            />
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'red',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <button
                style={{
                  background: 'white',
                  color: 'black',
                  padding: '8px 12px',
                  borderRadius: 12
                }}
                onClick={handleToggle}
              >
                Toggle scroll trigger cleanup
              </button>
            </div>
          </div>
        </AspectBox>
      </div>
    </div>
  )
}

StickyScrollTrigger.Layout = SmoothScrollLayout
export const title = 'Sticky ScrollTrigger'
export const description = ''

export default StickyScrollTrigger
