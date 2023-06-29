import { Leva, useControls } from 'leva'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AspectBox } from '~/components/layout/aspect-box'
import { HTMLLayout } from '~/components/layout/html-layout'
import s from '~/css/experiments/image-pixelation.module.scss'
import ImageExampleSrc from '~/public/images/rapid-image-layers/10.jpg'

const calcFibonnaciSeries = (n: number) => {
  const fibonnaciSeries = [0, 1]

  for (let i = 2; i < n + 1; i++) {
    fibonnaciSeries[i] = fibonnaciSeries[i - 1] + fibonnaciSeries[i - 2]
  }

  return fibonnaciSeries.splice(1)
}

const ImagePixelation = () => {
  const [startPixelAnimation, setStartPixelAnimation] = useState(false)
  const [pxFactorIndex, setPxFactorIndex] = useState<number>(0)
  const animatePixelsTm = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const pixelationOptions = useControls({
    steps: {
      value: 4,
      step: 1,
      min: 1,
      max: 11
    },
    stepsDuration: {
      value: 1,
      step: 0.1,
      min: 0.1,
      max: 3,
      label: 'steps duration factor'
    }
  })

  const pxFactorValues = useMemo(() => {
    return [...calcFibonnaciSeries(pixelationOptions.steps), 100]
  }, [pixelationOptions.steps])

  const render = useCallback(
    (pxFactorIndex: number) => {
      if (!canvasRef.current || !imgRef.current) return

      const canvas = canvasRef.current
      const img = imgRef.current

      // increase a bit to not have a gap in the end of the image
      // when we have big pixel sizes
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      const canvas2dCtx = canvasRef.current.getContext('2d')
      canvas.width = width
      canvas.height = height

      if (!canvas2dCtx || !img) return

      const pxFactor = pxFactorValues[pxFactorIndex]
      const size = pxFactor * 0.01

      // Turn off image smoothing to achieve the pixelated effect
      canvas2dCtx.imageSmoothingEnabled = false

      canvas2dCtx.clearRect(0, 0, canvas.width, canvas.height)

      canvas2dCtx.drawImage(img, 0, 0, width * size, height * size)
      canvas2dCtx.drawImage(
        canvas,
        0,
        0,
        width * size,
        height * size,
        0,
        0,
        width,
        height
      )
    },
    [pxFactorValues]
  )

  useEffect(() => {
    if (!canvasRef.current || !imgRef.current) return

    render(pxFactorIndex)

    if (!startPixelAnimation) return

    if (pxFactorIndex < pxFactorValues.length) {
      imgRef.current?.style.setProperty('opacity', '0')
      // Increase the pixelation factor and continue animating
      animatePixelsTm.current = setTimeout(() => {
        // Render the image with the current pixelation factor
        setPxFactorIndex(pxFactorIndex + 1)
      }, 100 * pixelationOptions.stepsDuration)
    } else {
      // Reset the pixelation factor and stop animating
      canvasRef.current?.style.setProperty('opacity', '0')
      imgRef.current?.style.setProperty('opacity', '1')
      setPxFactorIndex(0)
      setStartPixelAnimation(false)
    }

    return () => {
      if (animatePixelsTm.current) {
        clearTimeout(animatePixelsTm.current)
        animatePixelsTm.current = null
      }
    }
  }, [
    pixelationOptions.stepsDuration,
    pxFactorIndex,
    pxFactorValues.length,
    render,
    startPixelAnimation
  ])

  const handleAnimatePixelsTrigger = useCallback(() => {
    if (!canvasRef.current) return

    canvasRef.current?.style.setProperty('opacity', '1')
    setStartPixelAnimation(true)
  }, [])

  return (
    <section className={s.section}>
      <Leva />
      <button
        className={s.trigger}
        onClick={() => handleAnimatePixelsTrigger()}
      >
        Trigger pixel scaling animation
      </button>
      <div className={s['canvas__wrapper']}>
        <AspectBox ratio={ImageExampleSrc.width / ImageExampleSrc.height}>
          <canvas className={s.canvas} ref={canvasRef} />
          <Image
            style={{ opacity: 0 }}
            ref={imgRef}
            className={s.image}
            src={ImageExampleSrc}
            alt=""
          />
        </AspectBox>
      </div>
    </section>
  )
}

ImagePixelation.Title = 'Image pixelation'
ImagePixelation.Description = (
  <>
    <p>Pixelation image effect</p>
  </>
)
ImagePixelation.Tags = 'images,gsap'
ImagePixelation.Layout = HTMLLayout

export default ImagePixelation
