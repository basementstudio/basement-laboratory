import { gsap } from 'lib/gsap'
import { MouseEvent, useRef } from 'react'

import { HTMLLayout } from '~/components/layout/html-layout'

const BumpCards = () => {
  const hitMarkerRef = useRef(null)

  const onHover = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const cardCenter = {
      x: target.getBoundingClientRect().left + target.offsetWidth / 2,
      y: target.getBoundingClientRect().top + target.offsetHeight / 2
    }

    const hitVectorFromCenter = {
      x: e.clientX - cardCenter.x,
      y: e.clientY - cardCenter.y
    }

    const normalizedHitVector = {
      x: hitVectorFromCenter.x / target.offsetWidth,
      y: hitVectorFromCenter.y / target.offsetHeight
    }

    gsap.set([hitMarkerRef.current], {
      x: cardCenter.x + hitVectorFromCenter.x,
      y: cardCenter.y + hitVectorFromCenter.y
    })

    const durationFactor = 1.75
    const bumpFactor = 30

    const timeline = gsap.timeline()

    timeline.to([target], {
      overwrite: 'auto',
      x: -normalizedHitVector.x * bumpFactor,
      y: -normalizedHitVector.y * bumpFactor,
      duration: 0.15 * durationFactor,
      ease: 'power1.out'
    })

    timeline.to([target], {
      overwrite: 'auto',
      x: 0,
      y: 0,
      duration: 1 * durationFactor,
      ease: 'elastic.out(1, 0.3)'
    })
  }

  return (
    <>
      <span
        ref={hitMarkerRef}
        style={{
          position: 'fixed',
          zIndex: 1000,
          top: 0,
          left: 0,
          width: 5,
          height: 5,
          background: 'blue',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'red',
            borderRadius: 24,
            maxWidth: 'max-content',
            padding: 16,
            aspectRatio: '2/3',
            minWidth: 300
          }}
          onMouseEnter={onHover}
        >
          {/* Lorem Ipsum */}
        </div>
      </div>
    </>
  )
}

BumpCards.Layout = HTMLLayout
BumpCards.Title = 'Bump Card'

export default BumpCards
