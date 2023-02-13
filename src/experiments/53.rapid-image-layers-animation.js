import { useEffect, useRef } from 'react'

import s from '~/css/experiments/rapid-image-layers-animation.module.scss'

import { SmoothScrollLayout } from '../components/layout/smooth-scroll-layout'
import { useGsapContext } from '../hooks/use-gsap-context'
import { useToggleState } from '../hooks/use-toggle-state'
import { DURATION, gsap } from '../lib/gsap'

const layersNumber = 10
const tlOptions = {
  duration: DURATION * 2,
  panelDelay: 0.18
}

const RapidImageLayersAnimation = () => {
  const containerRef = useRef()
  const timelineRef = useRef()
  const { isOn: startAnimation, handleOff, handleOn } = useToggleState(false)

  useGsapContext(() => {
    if (!containerRef.current) return

    const layers = []
    containerRef.current.querySelectorAll('#layers-item').forEach((item) =>
      layers.push({
        el: item,
        image: item.querySelector('#layers-item-img')
      })
    )

    timelineRef.current = gsap.timeline({
      paused: true,
      onComplete: handleOff
    })

    for (let i = 0, len = layersNumber; i <= len - 1; ++i) {
      timelineRef.current.to(
        [layers[i].el, layers[i].image],
        {
          duration: tlOptions.duration,
          ease: 'power2.inOut',
          opacity: 1,
          y: 0,
          filter: 'blur(0px)'
        },
        tlOptions.panelDelay * i
      )
    }

    timelineRef.current
      .addLabel(
        'halfway',
        tlOptions.panelDelay * (layersNumber - 1) + tlOptions.duration
      )
      .call(
        () => {
          // hide all Image layers except the last one (at this point the last Image layer is visible fullscreen)
          layers
            .filter((_, pos) => pos != layersNumber - 1)
            .forEach((panel) => {
              gsap.set(panel.el, { opacity: 0 })
            })
        },
        null,
        'halfway'
      )
      .to(
        [layers[layersNumber - 1].el, layers[layersNumber - 1].image],
        {
          duration: tlOptions.duration,
          ease: 'expo.inOut',
          y: (index) => (index ? '101%' : '-101%')
        },
        'halfway'
      )
  }, [])

  useEffect(() => {
    if (!timelineRef.current) return

    if (startAnimation) {
      timelineRef.current.seek(0).play()
    }
  }, [startAnimation])

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <button className={s.button} onClick={handleOn}>
        Start Animation
      </button>
      <div ref={containerRef} className={s.layers}>
        {[...Array(layersNumber)].map((_, idx) => (
          <div id="layers-item" key={idx} className={s['layers__item']}>
            <div
              id="layers-item-img"
              className={s['layers__item-img']}
              style={{
                backgroundImage: `url(../images/rapid-image-layers/${
                  idx + 1
                }.jpg)`
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

RapidImageLayersAnimation.Title = 'Rapid Image Layers Animation'
RapidImageLayersAnimation.Layout = SmoothScrollLayout

export default RapidImageLayersAnimation
