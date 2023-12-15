import { createPortal, useFrame } from '@react-three/fiber'
import { useState } from 'react'
import * as THREE from 'three'
import { create } from 'zustand'

const previousScissor = new THREE.Vector4()
const previousViewport = new THREE.Vector4()

type UseDebugTextureViewerScreenSlotState = {
  slots: Map<number, THREE.Vector4>
  getSlot: (id: number, width: number, height: number) => THREE.Vector4
  freeSlot: (id: number) => void
}

const useDebugTextureViewerScreenSlot =
  create<UseDebugTextureViewerScreenSlotState>((_, get) => ({
    slots: new Map<number, THREE.Vector4>(),
    getSlot: (id: number, width: number, height: number) => {
      const slots = get().slots

      if (slots.has(id)) {
        return slots.get(id) as THREE.Vector4
      }

      /* Find a free slot */
      for (const [id, slot] of slots) {
        if (slot.z >= width && slot.w >= height) {
          /* Found a slot */
          slots.set(
            id,
            new THREE.Vector4(slot.x + width, slot.y, slot.z, height)
          )
          return new THREE.Vector4(slot.x, slot.y, width, height)
        }
      }

      console.warn(
        'useDebugTextureViewerScreenSlot: no free slot found for id:',
        id
      )

      return new THREE.Vector4()
    },
    freeSlot: (id: THREE.Texture['id']) => {
      const slots = get().slots
      slots.delete(id)
    }
  }))

const RenderScissorSlot = ({
  id,
  width,
  height,
  offset = [0, 0]
}: {
  id: number
  width: number
  height: number
  offset?: [number, number]
}) => {
  const screenSlot = useDebugTextureViewerScreenSlot()

  /* wip */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const scissorSlot = screenSlot.getSlot(id, width, height)

  useFrame((s) => {
    const previousSissorTest = s.gl.getScissorTest()
    s.gl.getScissor(previousScissor)
    s.gl.getViewport(previousViewport)

    const left = previousViewport.z - width - offset[0]
    const bottom = previousViewport.w - height - offset[1]

    s.gl.setViewport(left, bottom, width, height)
    s.gl.setScissor(left, bottom, width, height)
    s.gl.setScissorTest(true)

    s.gl.render(s.scene, s.camera)

    /* Revert */
    s.gl.setViewport(
      previousViewport.x,
      previousViewport.y,
      previousViewport.z,
      previousViewport.w
    )
    s.gl.setScissor(
      previousScissor.x,
      previousScissor.y,
      previousScissor.z,
      previousScissor.w
    )
    s.gl.setScissorTest(previousSissorTest)
  }, 1)

  return <></>
}

export const DebugTextureViewer = ({
  height = 128,
  texture,
  offset
}: {
  texture: THREE.Texture | THREE.DepthTexture
  offset?: [number, number]
  height?: number
}) => {
  const [virtualScene] = useState(() => new THREE.Scene())
  const [quadCam] = useState(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  )
  const aspect = texture.image.width / texture.image.height

  return (
    <>
      {/* @ts-ignore */}
      {createPortal(
        <>
          <RenderScissorSlot
            id={texture.id}
            width={height * aspect}
            height={height}
            offset={offset}
          />
          <mesh>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
              defines={{
                // eslint-disable-next-line no-prototype-builtins
                ...(texture.hasOwnProperty('isDepthTexture')
                  ? { IS_DEPTH: '' }
                  : {})
              }}
              uniforms={{
                tDiffuse: { value: texture }
              }}
              vertexShader={
                /* glsl */ `
                varying vec2 vUv;

                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `
              }
              fragmentShader={
                /* glsl */ `
                varying vec2 vUv;

                uniform sampler2D tDiffuse;

                void main() {
                  vec4 texel = texture2D(tDiffuse, vUv);

                  #ifdef IS_DEPTH
                    gl_FragColor = vec4(vec3(texel.r), 1.0);
                  #else
                    gl_FragColor = texel;
                  #endif
                }
              `
              }
            />
          </mesh>
        </>,
        virtualScene,
        {
          camera: quadCam,
          frameloop: 'never'
        }
      )}
    </>
  )
}
