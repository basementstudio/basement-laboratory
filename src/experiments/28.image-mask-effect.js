import {
  Canvas,
  Scroll,
  WebGLOut,
  WebGLShadow
} from '@basementstudio/definitive-scroll/three'
import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import glsl from 'glslify'
import Image from 'next/future/image'
import { useEffect, useRef } from 'react'
import { Vector2 } from 'three/src/math/Vector2'

import mishoJbImage from '../../public/images/misho-jb.jpg'
import { SmoothScrollLayout } from '../components/layout/smooth-scroll-layout'
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
  varying vec2 v_uv;

  float circle(in vec2 _st, in float _radius, in float blurriness){
    vec2 dist = _st;
    return 1.-smoothstep(_radius-(_radius*blurriness), _radius+(_radius*blurriness), dot(dist,dist)*4.0);
  }

  vec4 RGBtoCMYK (vec3 rgb) {
    float r = rgb.r;
    float g = rgb.g;
    float b = rgb.b;
    float k = min(1.0 - r, min(1.0 - g, 1.0 - b));
    vec3 cmy = vec3(0.0);
    float invK = 1.0 - k;
    if (invK != 0.0) {
        cmy.x = (1.0 - r - k) / invK;
        cmy.y = (1.0 - g - k) / invK;
        cmy.z = (1.0 - b - k) / invK;
    }
    return clamp(vec4(cmy, k), 0.0, 1.0);
  }

  void main() {
    // We manage the device ratio by passing PR constant
    vec2 res = u_res * PR;
    vec2 st = gl_FragCoord.xy / res.xy - vec2(0.5);
    // tip: use the following formula to keep the good ratio of your coordinates
    st.y *= u_res.y / u_res.x;
    float time = u_time * 0.0001;

    // We readjust the mouse coordinates
    vec2 mouse = u_mouse * 0.5;
    // tip2: do the same for your mouse
    mouse.y *= u_res.y / u_res.x;
    mouse *= -1.;

    vec2 circlePos = st + mouse;
    float c = circle(circlePos, 0.08, 2.) * 3.5;
  
    float offx = v_uv.x;
    float offy = v_uv.y - time - cos(time) * .01;
  
    float n1 = snoise3(vec3(offx, offy, time) * 300.) - 1.;
    float n2 = snoise3(vec3(offx, offy, time) * 200.) - 1.;
    float n3 = snoise3(vec3(offx, offy, time) * 6.) - 1.;
    float n4 = snoise3(vec3(offx, offy, time) * 2.) - 1.;
  
    float finalMask = smoothstep(0.99, 1., n1 + n2 + n3 + n4 + pow(c, 2.));

    vec4 image = texture2D(u_image, v_uv);
	  vec4 hover = texture2D(u_imagehover, v_uv);

    vec4 finalImage = mix(image, RGBtoCMYK(image.rgb), finalMask);

    gl_FragColor = vec4(vec3(finalImage), 1.);
  }
`

const imageEffect = (ref) => {
  const cursor = useRef()
  const texture = useTexture(
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=934&q=80'
  )

  const uniforms = useRef({
    u_image: { value: texture },
    u_imagehover: { value: texture },
    u_mouse: { value: { x: 0, y: 0 } },
    u_time: { value: 10 },
    u_res: {
      value: new Vector2(window.innerWidth, window.innerHeight)
    }
  })

  useEffect(() => {
    const tracker = trackCursor()

    cursor.current = tracker.cursor

    return tracker.destroy
  }, [])

  useFrame(() => {
    ref.current.material.uniforms.u_time.value += 0.01
    ref.current.material.uniforms.u_mouse.value = cursor.current
  })

  return (
    <mesh ref={ref}>
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

const EnhancedImage = () => {
  return (
    <div style={{ width: '30vw' }}>
      <WebGLShadow
        shadowChildren={
          <>
            <div style={{ opacity: 0 }}>
              <Image src={mishoJbImage} />
            </div>
          </>
        }
      >
        {imageEffect}
      </WebGLShadow>
    </div>
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
          <EnhancedImage />
        </div>
      </main>
    </div>
  )
}

ImageMaskEffect.Layout = SmoothScrollLayout
ImageMaskEffect.Title = 'Image Mask Effect'
ImageMaskEffect.Tags = 'private'

export default ImageMaskEffect
