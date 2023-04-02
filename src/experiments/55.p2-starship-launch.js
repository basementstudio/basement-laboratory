import Image from 'next/image'
import * as p2 from 'p2-es'
import { useEffect, useRef } from 'react'

import falcon9image from '../../public/images/falcon-9.png'
import { HTMLLayout } from '../components/layout/html-layout'

const falconScale = 1
const falcon9properties = {
  size: {
    width: (falcon9image.width / 10) * falconScale,
    height: (falcon9image.height / 10) * falconScale
  },
  mass: 1,
  yVelocity: 10
}
const fixedTimeStep = 1 / 10
const physicsToDOMScale = 80

function createBody(world, element) {
  const rect = element.getBoundingClientRect()
  // @ts-ignore
  const body = new p2.Body({
    mass: falcon9properties.mass,
    position: [
      (rect.left + rect.width / 2) / physicsToDOMScale,
      -(rect.top + rect.height / 2) / physicsToDOMScale
    ],
    velocity: [0, falcon9properties.yVelocity]
  })
  const shape = new p2.Box({
    width: falcon9properties.size.width / physicsToDOMScale,
    height: falcon9properties.size.height / physicsToDOMScale
  })

  body.addShape(shape)
  world.addBody(body)

  // Element
  element.style.position = 'absolute'
  element.style.top = '0'
  element.style.left = '0'
  element.style.transformOrigin = '50% 50%'
  element.style.width = `${falcon9properties.size.width}px`
  element.style.height = `${falcon9properties.size.height}px`

  updateTransform(body, element)
}

function updateTransforms(world, element) {
  // Update dynamic bodies
  const body = world.bodies[0]
  updateTransform(body, element)
}

function updateTransform(body, element) {
  if (body.shapes[0] === undefined) return

  // Convert physics coordinates to pixels
  const x =
    physicsToDOMScale *
    //@ts-ignore
    (body.interpolatedPosition[0] - body.shapes[0].width)
  const y =
    -physicsToDOMScale *
    //@ts-ignore
    (body.interpolatedPosition[1] + body.shapes[0].height)

  // Set element style
  const style =
    'translate(' +
    x +
    'px, ' +
    y +
    'px) rotate(' +
    -body.interpolatedAngle * 57.2957795 +
    'deg)'
  element.style.transform = style

  element.scrollIntoView({
    block: 'center',
    inline: 'center'
  })
}

const StarshipLaunch = () => {
  const containerRef = useRef()
  const falcon9ref = useRef()

  useEffect(() => {
    if (!falcon9ref.current || !containerRef.current) return

    const world = new p2.World({
      gravity: [0, 0],
      broadphase: new p2.SAPBroadphase()
    })

    const element = falcon9ref.current
    createBody(world, element)

    const height = containerRef.current.getBoundingClientRect().height * 2
    const planeBottomBody = new p2.Body({
      position: [0, (-height * 1.5) / physicsToDOMScale]
    })
    planeBottomBody.addShape(new p2.Plane())
    const planeTopBody = new p2.Body({
      position: [0, 0]
    })
    planeTopBody.addShape(new p2.Plane(), [0, 0], Math.PI)
    const planeLeftBody = new p2.Body()
    planeLeftBody.addShape(new p2.Plane(), [0, 0], -Math.PI / 2)
    const planeRightBody = new p2.Body({
      position: [
        containerRef.current.getBoundingClientRect().width / physicsToDOMScale,
        0
      ]
    })
    planeRightBody.addShape(new p2.Plane(), [0, 0], Math.PI / 2)
    world.addBody(planeBottomBody)
    world.addBody(planeTopBody)
    world.addBody(planeLeftBody)
    world.addBody(planeRightBody)

    let lastTimeMilliSeconds
    function update(timeMilliSeconds) {
      requestAnimationFrame(update)
      if (lastTimeMilliSeconds) {
        const deltaTime = (timeMilliSeconds - lastTimeMilliSeconds) / 1000
        world.step(fixedTimeStep, deltaTime, 1)
        updateTransforms(world, element)
      }
      lastTimeMilliSeconds = timeMilliSeconds
    }

    requestAnimationFrame(update)
  }, [])

  useEffect(() => {
    falcon9ref.current.scrollIntoView()
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: '1000vh',
          background:
            'linear-gradient(0deg, rgba(24,110,223,1) 0%, rgba(0,0,0,0) 100%)'
        }}
      >
        <div
          ref={falcon9ref}
          style={{
            position: 'absolute',
            zIndex: 10,
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          <Image
            src={falcon9image}
            width={falcon9image.width / 10}
            height={falcon9image.height / 10}
          />
        </div>
      </div>
    </div>
  )
}

StarshipLaunch.Title = 'Starship launch'
StarshipLaunch.Tag = 'p2, gsap'
StarshipLaunch.Layout = HTMLLayout

export default StarshipLaunch
