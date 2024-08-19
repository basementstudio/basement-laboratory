import { buttonGroup, useControls } from 'leva'
import type { MutableRefObject } from 'react'
import React, { useEffect, useRef } from 'react'

import { HTMLLayout } from '~/components/layout/html-layout'

const presets = [
  {
    creationRate: 20,
    size: 4,
    color: '#FF4D00',
    lifespan: 100,
    emissionRadius: 100,
    maxParticles: 2000,
    earthGravity: 0,
    cursorGravity: -1,
    blur: false
  },
  {
    creationRate: 14,
    size: 3,
    color: '#FF4D00',
    lifespan: 70,
    emissionRadius: 4,
    maxParticles: 2000,
    earthGravity: 0.6,
    cursorGravity: 0.1,
    blur: false
  },
  {
    creationRate: 70,
    size: 6,
    color: '#FF4D00',
    lifespan: 10,
    emissionRadius: 60,
    maxParticles: 4000,
    earthGravity: 0,
    cursorGravity: 1,
    blur: true
  },
  {
    creationRate: 100,
    size: 1,
    color: '#FF4D00',
    lifespan: 60,
    emissionRadius: 30,
    maxParticles: 10000,
    earthGravity: 0,
    cursorGravity: 0,
    blur: false
  },
  {
    creationRate: 100,
    size: 8,
    color: '#FF4D00',
    lifespan: 100,
    emissionRadius: 100,
    maxParticles: 1000,
    earthGravity: 0,
    cursorGravity: -1,
    blur: false
  }
]

export function useStateToRef<T = unknown>(initial: T): MutableRefObject<T> {
  const ref = useRef<T>(initial)

  useEffect(() => {
    ref.current = initial
  }, [initial])

  return ref
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result || !result[1] || !result[2] || !result[3]) return '187, 134, 255'
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
    result[3],
    16
  )}`
}

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string
  opacity: number
}

function ParticlesEmitter() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mousePosition = useRef({ x: 0, y: 0 })
  const particles = useRef<Particle[]>([])
  const animationRef = useRef<number>()

  /* Controls */
  const [values, set] = useControls(() => ({
    creationRate: { value: 1, min: 0.1, max: 100, step: 0.1 },
    size: { value: 4, min: 1, max: 10, step: 1 },
    color: '#FF4D00',
    lifespan: { value: 40, min: 10, max: 100, step: 10 },
    emissionRadius: { value: 1, min: 1, max: 100, step: 0.1 },
    maxParticles: { value: 60, min: 10, max: 10000, step: 10 },
    earthGravity: { value: 0.1, min: -1, max: 1, step: 0.01 },
    cursorGravity: { value: 0.1, min: -1, max: 1, step: 0.01 },
    blur: { value: false },
    preset: buttonGroup({
      label: '',
      opts: {
        Atomic: () => set(presets[0]),
        Asteroid: () => set(presets[1]),
        Supernova: () => set(presets[2]),
        Trail: () => set(presets[3]),
        Pulse: () => set(presets[4])
      }
    })
  }))

  const configRef = useStateToRef(values)

  /* Mouse Position */
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY }
    }

    const updateTouchPosition = (e: TouchEvent) => {
      mousePosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    }

    window.addEventListener('mousemove', updateMousePosition)
    window.addEventListener('touchmove', updateTouchPosition)

    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
      window.removeEventListener('touchmove', updateTouchPosition)
    }
  }, [])

  /* Particles */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderParticles = () => {
      let shadow = ''

      particles.current = particles.current.filter((p, i) => {
        // earth gravity
        p.speedY += configRef.current.earthGravity * 0.98

        const dx = mousePosition.current.x - p.x
        const dy = mousePosition.current.y - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // cursor gravity
        const cursorGravity = configRef.current.cursorGravity * 0.2
        p.speedX += (dx / distance) * cursorGravity
        p.speedY += (dy / distance) * cursorGravity

        // particle position
        p.x += p.speedX
        p.y += p.speedY

        p.size = Math.max(
          p.size - configRef.current.size / configRef.current.lifespan,
          0
        )
        p.opacity = Math.max(p.opacity - 1 / configRef.current.lifespan, 0)

        if (i > 0) shadow += ', '
        shadow += `${p.x - p.size}px ${p.y}px 0px ${p.size}px rgba(${hexToRgb(
          configRef.current.color
        )}, ${p.opacity})`

        return p.size > 0 && p.opacity > 0
      })

      if (particles.current.length < configRef.current.maxParticles) {
        const particlesToCreate = Math.min(
          configRef.current.maxParticles - particles.current.length,
          Math.ceil(configRef.current.creationRate)
        )

        for (let i = 0; i < particlesToCreate; i++) {
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random() * configRef.current.emissionRadius

          particles.current.push({
            x: mousePosition.current.x + Math.cos(angle) * radius,
            y: mousePosition.current.y + Math.sin(angle) * radius,
            size: configRef.current.size,
            speedX: (Math.random() - 0.5) * 2,
            speedY: (Math.random() - 0.5) * 2,
            opacity: 1,
            color: `rgba(${hexToRgb(configRef.current.color)}, 1)`
          })
        }
      }

      container.style.boxShadow = shadow

      animationRef.current = requestAnimationFrame(renderParticles)
    }

    renderParticles()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [configRef])

  return (
    <div
      ref={containerRef}
      style={{
        width: '0px',
        height: '0px',
        transform: 'translate3d(0, 0, 0)',
        filter: values.blur ? 'blur(3px) contrast(5)' : 'none'
      }}
    />
  )
}

ParticlesEmitter.Layout = HTMLLayout
ParticlesEmitter.Title = 'Particles emitter'
ParticlesEmitter.Description = 'Box-shadow particles emitter with gravity'

export default ParticlesEmitter
