import { gsap } from 'lib/gsap'
import { MouseEvent } from 'react'

import { HTMLLayout } from '~/components/layout/html-layout'

import s from './bump-cards.module.scss'

const BumpCards = () => {
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
      <div className={s['root']}>
        <div className={s['wrapper']}>
          <div className={s['card']} onMouseEnter={onHover}>
            <p style={{ fontFamily: 'Basement Grotesque Display' }}>
              Hover Me!
            </p>
          </div>

          <div className={s['card']} onMouseEnter={onHover}>
            <p style={{ fontFamily: 'Basement Grotesque Display' }}>
              Hover Me!
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

BumpCards.Layout = HTMLLayout
BumpCards.Title = 'Bump Card'

export default BumpCards
