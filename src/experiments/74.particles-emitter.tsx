import { useControls } from 'leva'
import React, { useEffect, useMemo, useRef } from 'react'

import { HTMLLayout } from '~/components/layout/html-layout'

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result || !result[1] || !result[2] || !result[3]) return null
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
  const {
    particleCreationRate,
    particleSize,
    particleColor,
    gravityStrength,
    particleLifespan,
    emissionRadius,
    maxParticles,
    updateFrequency
  } = useControls({
    particleCreationRate: { value: 1, min: 0.1, max: 1, step: 0.1 },
    particleSize: { value: 4, min: 1, max: 10, step: 1 },
    particleColor: '#FF4D00',
    gravityStrength: { value: 0.2, min: -1, max: 1, step: 0.01 },
    particleLifespan: { value: 40, min: 10, max: 100, step: 10 },
    emissionRadius: { value: 1, min: 1, max: 10, step: 0.1 },
    maxParticles: { value: 60, min: 10, max: 200, step: 10 },
    updateFrequency: { value: 1, min: 1, max: 2, step: 1 }
  })

  /* Mouse Position */
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener('mousemove', updateMousePosition)

    return () => window.removeEventListener('mousemove', updateMousePosition)
  }, [])

  const color = useMemo(
    () => hexToRgb(particleColor) || '187, 134, 255',
    [particleColor]
  )

  /* Particles */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let frameCount = 0

    const renderParticles = () => {
      frameCount++

      if (frameCount % updateFrequency === 0) {
        let shadow = ''

        particles.current = particles.current.filter((p, i) => {
          // gravity
          if (gravityStrength > 0) p.speedY += gravityStrength * 0.98

          const dx = mousePosition.current.x - p.x
          const dy = mousePosition.current.y - p.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (gravityStrength < 0) {
            // push away
            p.speedX -= (dx / distance) * updateFrequency
            p.speedY -= (dy / distance) * updateFrequency
          } else {
            // pull towards mouse
            p.speedX += (dx / distance) * updateFrequency
            p.speedY += (dy / distance) * updateFrequency
          }

          // particle position
          p.x += p.speedX
          p.y += p.speedY

          p.size = Math.max(
            p.size - particleSize / particleLifespan / updateFrequency,
            0
          )
          p.opacity = Math.max(
            p.opacity - 1 / particleLifespan / updateFrequency,
            0
          )

          if (i > 0) shadow += ', '
          shadow += `${p.x - p.size}px ${p.y}px 0px ${
            p.size
          }px rgba(${color}, ${p.opacity})`

          return p.size > 0 && p.opacity > 0
        })

        if (
          particles.current.length < maxParticles &&
          Math.random() < particleCreationRate / updateFrequency
        ) {
          const angle = Math.random() * Math.PI * 2

          let radius = Math.PI * Math.pow(emissionRadius, 2) * gravityStrength

          if (gravityStrength < 0) radius *= -1

          particles.current.push({
            x: mousePosition.current.x + Math.cos(angle) * radius,
            y: mousePosition.current.y + Math.sin(angle) * radius,
            size: particleSize,
            speedX: (Math.random() - 0.5) * 0.5 * radius,
            speedY: (Math.random() - 0.5) * 0.5 * radius,
            opacity: 1,
            color: `rgba(${color}, 1)`
          })
        }

        container.style.boxShadow = shadow
      }

      animationRef.current = requestAnimationFrame(renderParticles)
    }

    renderParticles()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    particleCreationRate,
    particleSize,
    color,
    gravityStrength,
    particleLifespan,
    emissionRadius,
    maxParticles,
    updateFrequency
  ])

  return (
    <div
      ref={containerRef}
      style={{
        width: '0px',
        height: '0px',
        transform: 'translate3d(0, 0, 0)'
      }}
    />
  )
}

ParticlesEmitter.Layout = HTMLLayout
ParticlesEmitter.Title = 'Particles emitter'
ParticlesEmitter.Description = 'Box-shadow particles emitter with gravity'

export default ParticlesEmitter
