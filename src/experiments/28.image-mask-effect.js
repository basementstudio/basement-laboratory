import {
  Canvas,
  Scroll,
  WebGLOut,
  WebGLShadow
} from '@basementstudio/definitive-scroll/three'
import { useTexture } from '@react-three/drei'
import glsl from 'glslify'
import { button, useControls } from 'leva'
import Image from 'next/future/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Vector2 } from 'three/src/math/Vector2'

import sampleImage from '../../public/images/face-hover.jpg'
import { SmoothScrollLayout } from '../components/layout/smooth-scroll-layout'
import { DURATION, gsap } from '../lib/gsap'
import { trackCursor } from '../lib/three'

const vertex = glsl/* glsl */ `
  varying vec2 v_uv;

  void main() {
    v_uv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = glsl/* glsl */ `
  #pragma glslify: snoise3 = require('glsl-noise/simplex/3d')

  uniform vec2 u_mouse;
  uniform vec2 u_res;
  uniform float u_time;
  uniform sampler2D u_image;
  uniform sampler2D u_imagehover;
  uniform float u_progressHover;
  uniform vec3 u_multipliers;

  /* Config */
  uniform float u_portalRadius1;
  uniform float u_portalRadius2;
  uniform float u_portalRadius3;

  varying vec2 v_uv;

  float circle(in vec2 _st, in float _radius, in float blurriness){
    vec2 dist = _st;
    return 1. - smoothstep(_radius-(_radius*blurriness), _radius+(_radius*blurriness), dot(dist,dist)*4.0);
  }

  void main() {
    // We manage the device ratio by passing PR constant
    vec2 res = u_res * PR;
    vec2 st = gl_FragCoord.xy / res.xy - vec2(0.5);
    // tip: use the following formula to keep the good ratio of your coordinates
    st.y *= u_res.y / u_res.x;
    float time = u_time * 0.001;
    float progressHover = u_progressHover;

    // We readjust the mouse coordinates
    vec2 mouse = u_mouse * 0.5;
    // tip2: do the same for your mouse
    mouse.y *= u_res.y / u_res.x;
    mouse *= -1.;

    vec2 circlePos = st + mouse;

    float c1 = circle(circlePos * 1., u_portalRadius1 * progressHover, 2.) * 3.5;
    float c2 = circle(circlePos * 1., u_portalRadius2 * progressHover, 2.) * 3.5;
    float c3 = circle(circlePos * 1., u_portalRadius3 * progressHover, 2.) * 3.5;

    float offx = v_uv.x;
    float offy = v_uv.y - time - cos(time) * .01;

    float n1 = snoise3(vec3(offx, offy, time) * 300.) - 1.;
    float n2 = snoise3(vec3(offx, offy, time) * 200.) - 1.;
    float n3 = snoise3(vec3(offx, offy, time * 50.0) * 6.) - 1.;
    float n4 = snoise3(vec3(offx, offy, time * 50.0) * 2.) - 1.;

    float mixedNoise =  (n1 + n2 + n3 + n4);

    float finalMask1 = smoothstep(0.99, 1., mixedNoise + pow(c1, 2.)) * progressHover;
    float finalMask2 = smoothstep(0.99, 1., mixedNoise + pow(c2, 2.)) * progressHover;
    float finalMask3 = smoothstep(0.99, 1., mixedNoise + pow(c3, 2.)) * progressHover;

    vec4 image = texture2D(u_image, v_uv);
    vec4 hover = vec4(1., 1., 1., 1.) - (image * 1.5);

    vec4 finalImage = mix(
      image,
      hover,
      clamp(
        /* Color multiplier */
        (finalMask3 - finalMask2) * 0.13 +
        /* Color multiplier */
        (finalMask2 - finalMask1) * 0.7 +
        finalMask1,
        0.,
        1.
      )
    );

    gl_FragColor = vec4(vec3(finalImage), 1.);
  }
`

const ImageEffect = ({ src, imageRef, onLoad, ...rest }) => {
  const ref = useRef()
  const texture = useTexture(src, onLoad)
  const config = useControls({
    portalRadius1: {
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.03,
      onChange: (v) => (uniforms.current.u_portalRadius1.value = v)
    },
    portalRadius2: {
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.06,
      onChange: (v) => (uniforms.current.u_portalRadius2.value = v)
    },
    portalRadius3: {
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.14,
      onChange: (v) => (uniforms.current.u_portalRadius3.value = v)
    },
    'Show portal on center': button(() => {
      if (ref.current) {
        ref.current.material.uniforms.u_mouse.value.x = 0
        ref.current.material.uniforms.u_mouse.value.y = 0
        ref.current.material.uniforms.u_progressHover.value = 1
      }
    })
  })

  const uniforms = useRef({
    u_image: { value: texture },
    u_imagehover: { value: texture },
    u_mouse: { value: { x: 0, y: 0 } },
    u_time: { value: 0 },
    u_dtime: { value: 0 },
    u_multipliers: { value: { x: 0, y: 0, z: 0 } },
    u_progressHover: { value: 0 },
    u_res: {
      value: new Vector2(window.innerWidth, window.innerHeight)
    },

    /* Config */
    u_portalRadius1: { value: config.portalRadius1 },
    u_portalRadius2: { value: config.portalRadius2 },
    u_portalRadius3: { value: config.portalRadius3 }
  })

  useEffect(() => {
    if (!imageRef?.current || !ref?.current) return

    let updateCallbackId
    let mouseTracker
    const imageElm = imageRef.current

    const update = () => {
      ref.current.material.uniforms.u_time.value += 0.01
    }

    const handleHoverImage = () => {
      if (updateCallbackId) {
        gsap.ticker.remove(updateCallbackId)
      }

      if (trackCursor) {
        mouseTracker?.destroy()
      }

      updateCallbackId = gsap.ticker.add(update)
      mouseTracker = trackCursor((cursor) => {
        gsap[mouseTracker.firstRead ? 'set' : 'to'](
          ref.current?.material?.uniforms?.u_mouse?.value,
          {
            x: cursor.x,
            y: cursor.y,
            overwrite: true,
            ease: 'power2.out'
          }
        )
      })

      gsap.to(ref.current?.material?.uniforms?.u_progressHover, {
        value: 1,
        overwrite: true,
        ease: 'power2.out',
        duration: DURATION
      })
    }

    const handleUnhoverImage = () => {
      gsap.to(ref.current?.material?.uniforms?.u_progressHover, {
        value: 0,
        overwrite: true,
        ease: 'power2.out',
        duration: DURATION * 0.65,
        onComplete: () => {
          gsap.ticker.remove(update)

          mouseTracker?.destroy()

          updateCallbackId = undefined
          mouseTracker = undefined
        }
      })
    }

    const firstCheck = () => {
      handleHoverImage()
      imageElm.removeEventListener('mousemove', firstCheck)
    }

    imageElm?.addEventListener('mousemove', firstCheck)
    imageElm?.addEventListener('mouseenter', handleHoverImage)
    imageElm?.addEventListener('mouseleave', handleUnhoverImage)

    return () => {
      imageElm?.removeEventListener('mouseenter', handleHoverImage)
      imageElm?.removeEventListener('mouseleave', handleUnhoverImage)
      imageElm?.removeEventListener('mousemove', firstCheck)
      gsap.ticker.remove(updateCallbackId)
      mouseTracker?.destroy()
    }
  }, [])

  return (
    <mesh {...rest} ref={ref}>
      <planeBufferGeometry args={[1, 1]} />
      <shaderMaterial
        uniforms={uniforms.current}
        defines={{
          PR: window.devicePixelRatio.toFixed(1)
        }}
        vertexShader={vertex}
        fragmentShader={fragment}
      />
    </mesh>
  )
}

const EnhancedImage = ({ src: image, ...rest }) => {
  const [loaded, setLoaded] = useState(false)

  const imageRef = useRef()

  const handleLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <WebGLShadow
      shadowChildren={
        <div style={{ opacity: loaded ? 0 : 1 }} ref={imageRef}>
          <Image draggable={false} src={image} {...rest} priority />
        </div>
      }
    >
      <ImageEffect src={image.src} imageRef={imageRef} onLoad={handleLoad} />
    </WebGLShadow>
  )
}

const ImageMaskEffect = () => {
  return (
    <div>
      <div
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: -1
        }}
      >
        <Canvas debug>
          <Scroll>
            <WebGLOut />
          </Scroll>
        </Canvas>
      </div>

      <main style={{ height: '150vh' }}>
        <div
          style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ width: '70vw' }}>
            <EnhancedImage src={sampleImage} alt="image" />
          </div>
        </div>
      </main>
    </div>
  )
}

ImageMaskEffect.Layout = SmoothScrollLayout
ImageMaskEffect.Title = 'Image Mask Effect'
ImageMaskEffect.Tags = 'private'

export default ImageMaskEffect
