import { Flowmap, Texture, Vec2, Vec4 } from 'ogl'
import * as React from 'react'
import { useFrame, useOGL } from 'react-ogl'

import { OGLCanvasLayout } from '../components/layout/ogl-canvas-layout'
import { fragment, vertex } from '../shaders/hover-flowmap'

class TextureLoader extends Texture {
  load(src) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => (this.image = img)
    img.src = src
    return this
  }
}

const HoverFlowmap = () => {
  const meshRef = React.useRef()
  const lastTimeRef = React.useRef()
  const mouse = React.useMemo(() => new Vec2(-1), [])
  const velocity = React.useMemo(() => new Vec2(), [])
  const lastMouse = React.useMemo(() => new Vec2(), [])
  const { gl } = useOGL()
  const flowmap = new Flowmap(gl, { falloff: 0.2, dissipation: 0.9 })

  const isTouchCapable = 'ontouchstart' in window

  const texture = new TextureLoader(gl, {
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
    premultiplyAlpha: true
  }).load(
    isTouchCapable
      ? '/images/basement-flowmap-mobile.svg'
      : '/images/basement-flowmap.svg'
  )
  const aspect = window.innerWidth / window.innerHeight

  let imgSize = isTouchCapable ? [800, 1000] : [1600, 1200]
  const imageAspect = imgSize[1] / imgSize[0]
  let a1, a2
  if (window.innerHeight / window.innerWidth < imageAspect) {
    a1 = 1
    a2 = window.innerHeight / window.innerWidth / imageAspect
  } else {
    a1 = (window.innerWidth / window.innerHeight) * imageAspect
    a2 = 1
  }

  const updateMouse = React.useCallback(
    (e) => {
      e.preventDefault()

      if (e.x === undefined) {
        e.x = e.pageX
        e.y = e.pageY
      }

      // Get mouse value in 0 to 1 range, with y flipped
      mouse.set(e.x / gl.renderer.width, 1.0 - e.y / gl.renderer.height)
      // Calculate velocity
      if (!lastTimeRef.current) {
        // First frame
        lastTimeRef.current = window.performance.now()
        lastMouse.set(e.x, e.y)
      }

      const deltaX = e.x - lastMouse.x
      const deltaY = e.y - lastMouse.y

      lastMouse.set(e.x, e.y)

      let time = window.performance.now()

      // Avoid dividing by 0
      let delta = Math.max(10.4, time - lastTimeRef.current)
      lastTimeRef.current = time
      velocity.x = deltaX / delta
      velocity.y = deltaY / delta
      // Flag update to prevent hanging velocity values when not moving
      velocity.needsUpdate = true
    },
    [gl.renderer.height, gl.renderer.width, lastMouse, mouse, velocity]
  )

  useFrame((_, delta) => {
    if (!velocity.needsUpdate) {
      mouse.set(-1)
      velocity.set(0)
    }
    velocity.needsUpdate = false
    // Update flowmap inputs
    flowmap.aspect = aspect
    flowmap.mouse.copy(mouse)
    // Ease velocity input, slower when fading out
    flowmap.velocity.lerp(velocity, velocity.len ? 0.15 : 0.1)
    flowmap.update()
    if (meshRef.current) {
      meshRef.current.program.uniforms.uTime.value = delta * 0.01
    }
  })

  React.useEffect(() => {
    if (isTouchCapable) {
      window.addEventListener('touchstart', updateMouse, false)
      window.addEventListener('touchmove', updateMouse, { passive: false })
    } else {
      window.addEventListener('mousemove', updateMouse, false)
    }

    return () => {
      if (isTouchCapable) {
        window.removeEventListener('touchstart', updateMouse, false)
        window.removeEventListener('touchmove', updateMouse, { passive: false })
      } else {
        window.removeEventListener('mousemove', updateMouse, false)
      }
    }
  }, [isTouchCapable, updateMouse])

  return (
    <mesh ref={meshRef}>
      <program
        vertex={vertex}
        fragment={fragment}
        uniforms={{
          uTime: { value: 0 },
          tWater: {
            value: texture
          },
          res: {
            value: new Vec4(window.innerWidth, window.innerHeight, a1, a2)
          },
          img: { value: new Vec2(imgSize[0], imgSize[1]) },
          tFlow: flowmap.uniform
        }}
      />
      <geometry
        position={{ size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) }}
        uv={{ size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) }}
      />
    </mesh>
  )
}

HoverFlowmap.getLayout = ({ Component, title, description, slug }) => {
  return (
    <>
      <OGLCanvasLayout
        style={{ height: 'calc(var(--vh) * 100)' }}
        renderer={{ alpha: true, premultipliedAlpha: true }}
        dpr={2}
        title={title}
        description={description}
        slug={slug}
      >
        <Component />
      </OGLCanvasLayout>
    </>
  )
}

HoverFlowmap.Title = 'Hover flowmap'
HoverFlowmap.Description =
  'This is an example of a flowmap that can be used to create a hover effect. Made with OGL & React-OGL.'

export default HoverFlowmap
