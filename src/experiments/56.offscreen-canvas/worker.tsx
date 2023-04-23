import { useThree } from '@react-three/fiber'
import { render } from '@react-three/offscreen'
import { set } from 'lodash'
import { useEffect, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

import { getWorld } from '~/lib/three'

const Scroll = ({ children }: { children: React.ReactNode }) => {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const world = getWorld(gl, camera)

    const onScroll = (scrollTop: number) => {
      if (!groupRef.current) return

      const threeY = world.fromBoundingRect({
        height: scrollTop
      })

      groupRef.current.position.y = threeY.size.height
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'scroll') {
        onScroll(event.data.payload.scrollTop)
      }
    }

    self.addEventListener('message', handleMessage)

    return () => {
      self.removeEventListener('message', handleMessage)
    }
  }, [gl, camera])

  return <group ref={groupRef}>{children}</group>
}

const Scene = () => {
  const { scene, camera, gl } = useThree((state) => ({
    scene: state.scene,
    camera: state.camera,
    gl: state.gl
  }))

  useLayoutEffect(() => {
    self.postMessage({ type: 'ready' })

    const world = getWorld(gl, camera)

    self.addEventListener('message', (event) => {
      if (event.data.type === 'scroll-track') {
        const payload = event.data.payload

        const threeBounds = world.fromBoundingRect({
          left: payload.bounds.left,
          top: payload.bounds.top,
          width: payload.bounds.width,
          height: payload.bounds.height
        })

        const myMesh = scene.getObjectByName(payload.target) as THREE.Mesh

        myMesh.position.set(threeBounds.position.x, threeBounds.position.y, 0)
        myMesh.scale.set(threeBounds.size.width, threeBounds.size.height, 1)
      }

      if (event.data.type === 'set') {
        const payload = event.data.payload

        const target = scene.getObjectByName(payload.target) as THREE.Mesh

        set(target, payload.path, payload.value)
      }
    })
  }, [scene, camera, gl])

  return (
    <>
      <Scroll>
        <mesh name="scroll-mesh">
          <planeGeometry />
          <meshBasicMaterial color="blue" />
        </mesh>
      </Scroll>

      <mesh name="rotate-mesh">
        <boxGeometry />
        <meshBasicMaterial color="red" />
      </mesh>
    </>
  )
}

render(<Scene />)
