import { useControls } from 'leva'
import { gsap } from 'lib/gsap'
import React, { useEffect, useState } from 'react'

import { HTMLLayout } from '~/components/layout/html-layout'
import { useRefState } from '~/hooks/use-ref-state'
import { useTimeline } from '~/hooks/use-timeline'
import { useTrackDragInertia } from '~/hooks/use-track-drag'

const links = ['Home', 'About', 'Contact', 'Projects']
const REPS = 3
const DISPLAY_LINKS_LENGTH = links.length * REPS

const NavExperiment = () => {
  const { radius, factorX, factorY, translateX, posX, stepFactor, debug } =
    useControls({
      radius: {
        value: 450,
        min: 100,
        max: 500
      },
      factorX: {
        value: 0.5,
        min: 0,
        max: 1
      },
      factorY: {
        value: 1,
        min: 0,
        max: 1
      },
      translateX: {
        value: -58,
        min: -100,
        max: 100
      },
      posX: {
        value: 0,
        min: 0,
        max: 100
      },
      stepFactor: {
        value: 1,
        min: 0.1,
        max: 1
      },
      debug: true
    })

  const ANGLE_STEP = (360 / DISPLAY_LINKS_LENGTH) * stepFactor
  const ANGLE_STEP_RAD = ANGLE_STEP * (Math.PI / 180)

  const [radOffset, setRadOffset] = useRefState(
    /* 90deg + angle step */
    -Math.PI / 2 + ANGLE_STEP_RAD
  )
  const [delta, setDelta] = useState(0)
  const { listeners } = useTrackDragInertia({
    onMotion: ({ deltaY }) => {
      setDelta(deltaY)
      setRadOffset((v) => {
        const newRad = v + deltaY / 100

        return newRad
      })
    },
    weight: 0.98
  })
  const [open, setOpen] = useState(false)

  const openTimeline = useTimeline(() => {
    // return
    const tl = gsap.timeline({})

    tl.set('#wheel > * > *:nth-child(1)', {
      opacity: 0
    })
      .to(
        ['#menu-border', '#menu-icon'],
        {
          scale: 1.1,
          opacity: 0,
          duration: 0.75
        },
        0
      )
      .set('#overlay', {
        display: 'block'
      })
      .fromTo(
        ['#close-border', '#close-icon'],
        {
          scale: 1.1,
          opacity: 0
        },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1
        }
      )
      .fromTo(
        '#wheel > * > *:nth-child(1)',
        {
          display: 'inline-block',
          x: -50
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: {
            each: 0.06
          }
        },
        '<'
      )

    return tl
  }, [links.length])

  const closeTimeline = useTimeline(() => {
    const tl = gsap.timeline()

    tl.fromTo(
      '#close-border',
      {
        scale: 1
      },
      {
        scale: 0.9,
        duration: 0.6,
        opacity: 0
      }
    ).fromTo(
      '#close-icon',
      {
        rotate: 0,
        opacity: 1
      },
      {
        rotate: 180,
        opacity: 0,
        duration: 0.6,
        scale: 0.8,
        ease: 'power3.in'
      },
      '<'
    )
    tl.to(
      '#wheel > * > *:nth-child(1)',
      {
        x: -50,
        opacity: 0,
        ease: 'power3.in',
        duration: 0.56
      },
      '<'
    )
      .set('#overlay', {
        display: 'none'
      })
      .to(['#menu-border', '#menu-icon'], {
        scale: 1,
        opacity: 1,
        duration: 0.6
      })

    return tl
  })

  useEffect(() => {
    if (open) {
      closeTimeline?.pause()
      openTimeline?.invalidate()
      openTimeline?.restart()
    } else if (!open) {
      openTimeline?.pause()
      closeTimeline?.invalidate()
      closeTimeline?.restart()
    }
  }, [open, openTimeline, closeTimeline])

  useEffect(() => {
    const html = document.querySelector('html')
    const prevOverscrollBehavior = html.style.overscrollBehavior
    html.style.overscrollBehavior = 'none'
    return () => {
      html.style.overscrollBehavior = prevOverscrollBehavior
    }
  }, [])

  return (
    <>
      <div
        id="overlay"
        {...listeners}
        onMouseDown={(e) => {
          listeners.onMouseDown(e)
        }}
        onTouchStart={(e) => {
          listeners.onTouchStart(e)
        }}
        style={{
          display: 'none',
          background:
            'radial-gradient(circle at -50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 100%)'
        }}
        className="fixed z-10 w-full h-[100svh]"
      >
        <p className="absolute bottom-0 right-0">
          offset: {radOffset.toFixed(2)}rad - delta: {delta.toFixed(2)}
        </p>
        <ul
          id="wheel"
          style={{
            transform: `translateX(${translateX}%) translateY(-50%)`,
            top: '50%',
            left: posX + '%',
            width: radius * 2 + 'px',
            height: radius * 2 + 'px'
          }}
          className="relative rounded-full bg-[transparent]"
        >
          <div
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scaleX(${factorX}) scaleY(${factorY})`,
              width: radius * 2 + 'px',
              height: radius * 2 + 'px',
              background: 'red',
              position: 'absolute',
              display: debug ? 'block' : 'none'
            }}
            className="rounded-full"
          />
          {[links, links, links].flat().map((m, idx) => {
            const anglePos = ANGLE_STEP * idx
            const anglePosRad = anglePos * (Math.PI / 180)
            const x = radius * Math.cos(anglePosRad + radOffset)
            const y = radius * Math.sin(anglePosRad + radOffset)
            const rotate =
              Math.atan2(y * factorX, x * factorY) * (180 / Math.PI)

            return (
              <li
                key={m + idx}
                style={{
                  top: `${50}%`,
                  left: `${50}%`,
                  transform: `translateX(calc(${
                    x * factorX
                  }px)) translateY(calc(-50% + ${
                    y * factorY
                  }px)) rotate(${rotate}deg)`,
                  transformOrigin: 'left center'
                }}
                className="absolute text-em-[54/16]"
              >
                <a className="" href="#">
                  {m}
                </a>
              </li>
            )
          })}
        </ul>

        <button
          id="close"
          onClick={() => setOpen((v) => !v)}
          className="absolute z-10 p-3.5 max-lg:bottom-8 lg:-translate-x-1/2 max-lg:right-8 lg:left-1/2 lg:top-1/2 max-w-max lg:-translate-y-1/2"
        >
          <span
            id="close-border"
            className="absolute top-0 left-0 w-full h-full border-2 rounded-full border-zinc-800"
          />
          <svg
            id="close-icon"
            width="32"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="6.13672"
              y="18.1572"
              width="17"
              height="1"
              transform="rotate(-45 6.13672 18.1572)"
              fill="white"
            />
            <rect
              x="6.84375"
              y="6.13672"
              width="17"
              height="1"
              transform="rotate(45 6.84375 6.13672)"
              fill="white"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-center w-full h-[100svh]">
        <button
          id="menu"
          onClick={() => setOpen((v) => !v)}
          className="relative p-3.5"
        >
          <span
            id="menu-border"
            className="absolute top-0 left-0 w-full h-full border-2 rounded-full border-zinc-800"
          />
          <svg
            id="menu-icon"
            width="32"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="4" y="12" width="17" height="1" fill="white" />
            <rect x="4" y="7" width="17" height="1" fill="white" />
            <rect x="4" y="17" width="17" height="1" fill="white" />
          </svg>
        </button>
      </div>
    </>
  )
}

NavExperiment.Layout = HTMLLayout
NavExperiment.Title = 'Nav Experiment'
NavExperiment.Description = 'This is a Nav Experiment'

export default NavExperiment
