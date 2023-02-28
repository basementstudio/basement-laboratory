import clsx from 'clsx'
import { Leva, useControls } from 'leva'
import { useCallback, useEffect, useRef } from 'react'

import { Loader, useLoader } from '~/components/common/loader'
import s from '~/css/experiments/rapid-image-layers-animation.module.scss'

import { SmoothScrollLayout } from '../components/layout/smooth-scroll-layout'
import { useGsapContext } from '../hooks/use-gsap-context'
import { useToggleState } from '../hooks/use-toggle-state'
import { DURATION, gsap } from '../lib/gsap'

const layers = [
  {
    assetName: '1',
    format: 'jpg'
  },
  {
    assetName: '2',
    format: 'jpg'
  },
  {
    assetName: '3',
    format: 'jpg'
  },
  {
    assetName: '4',
    format: 'jpg'
  },
  {
    assetName: '5',
    format: 'jpg'
  },
  {
    assetName: '6',
    format: 'jpg'
  },
  {
    assetName: '7',
    format: 'jpg'
  },
  {
    assetName: '8',
    format: 'jpg'
  },
  {
    assetName: '9',
    format: 'jpg'
  },
  {
    assetName: 'hennessy-bruto',
    format: 'mp4'
  }
]

const RapidImageLayersAnimation = () => {
  const containerRef = useRef()
  const timelineRef = useRef()
  const { isOn: startAnimation, handleOff, handleOn } = useToggleState(false)
  const setLoaded = useLoader((s) => s.setLoaded)

  const tlOptions = useControls({
    duration: {
      min: 0.1,
      step: 0.1,
      value: DURATION * 5,
      max: 20
    },
    panelDelay: {
      min: 0.1,
      step: 0.1,
      value: DURATION * 1.5,
      max: 20
    },
    lastPanelDelay: {
      min: 0.1,
      step: 0.1,
      value: (DURATION * 5) / 2.5,
      max: 20
    },
    timeScale: {
      min: 0.1,
      step: 0.1,
      value: 1,
      max: 20
    }
  })

  const getLayerItem = useCallback((item) => {
    const baseProps = {
      id: 'layers-item-asset',
      className: s['layers__item-asset'],
      assetUrl: `../images/rapid-image-layers/${item.assetName}.${item.format}`
    }

    switch (item.format) {
      case 'jpg': {
        return (
          <div
            id={baseProps.id}
            className={baseProps.className}
            style={{
              backgroundImage: `url(${baseProps.assetUrl})`
            }}
          />
        )
      }
      case 'mp4': {
        return (
          <video
            id={baseProps.id}
            className={clsx(baseProps.className, s.video)}
            src={baseProps.assetUrl}
            muted
            loop
            playsInline
            autoPlay
          />
        )
      }
    }
  }, [])

  useGsapContext(() => {
    if (!containerRef.current) return

    const layers = []
    containerRef.current.querySelectorAll('#layers-item').forEach((item) =>
      layers.push({
        el: item,
        image: item.querySelector('#layers-item-asset')
      })
    )

    timelineRef.current = gsap.timeline({
      paused: true,
      onComplete: handleOff
    })

    for (let i = 0, len = layers.length; i <= len - 1; ++i) {
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
        tlOptions.panelDelay * (layers.length - 1) + tlOptions.duration
      )
      .call(
        () => {
          // hide all Image layers except the last one (at this point the last Image layer is visible fullscreen)
          layers
            .filter((_, pos) => pos != layers.length - 1)
            .forEach((panel) => {
              gsap.set(panel.el, { opacity: 0 })
            })
        },
        null,
        'halfway'
      )
      .to(
        [layers[layers.length - 1].el, layers[layers.length - 1].image],
        {
          duration: tlOptions.duration / 2.5,
          delay: tlOptions.lastPanelDelay,
          ease: 'expo.inOut',
          y: (index) => (index ? '101%' : '-101%')
        },
        'halfway'
      )
  }, [tlOptions])

  // Preload images
  useEffect(() => {
    const promiseArray = layers.map((layer) => {
      if (layer.format === 'jpg') {
        return new Promise((resolve) => {
          const img = new Image()
          img.onload = resolve
          img.src = `../images/rapid-image-layers/${layer.assetName}.${layer.format}`
        })
      }
    })

    Promise.all(promiseArray).then(() => {
      setLoaded(true)
    })
  }, [setLoaded])

  useEffect(() => {
    if (!timelineRef.current) return

    if (startAnimation) {
      timelineRef.current.seek(0).timeScale(tlOptions.timeScale).play()
    }
  }, [startAnimation, tlOptions.timeScale])

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <Leva />
      <Loader />
      <button className={s.button} onClick={handleOn}>
        Start Animation
      </button>
      <div ref={containerRef} className={s.layers}>
        {layers.map((layer, idx) => (
          <div id="layers-item" key={idx} className={s['layers__item']}>
            {getLayerItem(layer)}
          </div>
        ))}
      </div>
    </div>
  )
}

RapidImageLayersAnimation.Title = 'Rapid Image Layers Animation'
RapidImageLayersAnimation.Layout = SmoothScrollLayout

export default RapidImageLayersAnimation
