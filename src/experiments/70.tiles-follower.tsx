import { gsap } from 'lib/gsap'
import { useEffect, useRef } from 'react'

import { HTMLLayout } from '~/components/layout/html-layout'

const TILE_SIZE = 16
const TILE_COUNT = 32

class MouseFollower {
  x: number
  y: number

  constructor() {
    this.x = 0
    this.y = 0
  }

  onMouseMove = (e: MouseEvent) => {
    this.x = e.clientX
    this.y = e.clientY
  }

  init() {
    window.addEventListener('mousemove', this.onMouseMove)
  }

  destroy() {
    window.removeEventListener('mousemove', this.onMouseMove)
  }

  get position() {
    return { x: this.x, y: this.y }
  }
}

const follower = new MouseFollower()

const Tile = () => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tileBounds = ref.current?.getBoundingClientRect()

    /* Mouse follower */
    const updateTile = () => {
      if (!tileBounds) return
      /* Rotate based on tile position */
      gsap.set(ref.current, {
        rotation:
          (Math.atan2(
            follower.position.y - tileBounds.top,
            follower.position.x - tileBounds.left
          ) *
            180) /
          Math.PI
      })
    }

    gsap.ticker.add(updateTile)

    return () => {
      /* Cleanup */
      gsap.ticker.remove(updateTile)
    }
  }, [])

  return (
    <div
      style={{
        height: TILE_SIZE,
        width: TILE_SIZE / 3,
        background: 'white'
      }}
      ref={ref}
    />
  )
}

const TilesFollower = () => {
  useEffect(() => {
    follower.init()

    return () => {
      follower.destroy()
    }
  }, [])

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${TILE_COUNT}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${TILE_COUNT}, ${TILE_SIZE}px)`
        }}
      >
        {Array.from({ length: TILE_COUNT * TILE_COUNT }).map((_, i) => (
          <div
            key={i}
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE
            }}
          >
            <Tile />
          </div>
        ))}
      </div>
    </div>
  )
}

TilesFollower.Layout = HTMLLayout
TilesFollower.Title = 'Tiles Follower'
TilesFollower.Description = '...'

export default TilesFollower
