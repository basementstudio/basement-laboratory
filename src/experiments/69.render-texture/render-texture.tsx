/**
 * This file is based on the RenderTexture component from @react-three/drei.
 * Source: https://github.com/pmndrs/drei/blob/master/src/core/RenderTexture.tsx
 * License: https://github.com/pmndrs/drei/blob/master/LICENSE
 */

import { createPortal, RootState, useFrame, useThree } from '@react-three/fiber'
import { DomEvent } from '@react-three/fiber/dist/declarations/src/core/events'
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import * as THREE from 'three'
import { RGBAFormat, Scene } from 'three'

export interface PaintCanvasProps {
  /** Whether the render target is active */
  isPlaying?: boolean
  /** The width of the render target */
  width?: number
  /** The height of the render target */
  height?: number
  /** Attach the texture to a THREE.Object3D */
  attach?: string | null
  /** Callback called when a new mapTexture is used */
  onMapTexture?: (texture: THREE.Texture) => void
  /** Callback called when a new depthTexture is used */
  onDepthTexture?: (texture: THREE.DepthTexture) => void
  /** Use a custom render target */
  fbo?: THREE.WebGLRenderTarget
  /** A scene to use as a container */
  containerScene?: Scene
  /** Use global mouse coordinate to calculate raycast */
  useGlobalPointer?: boolean
  /** Priority of the render frame */
  renderPriority?: number
}

export const renderTextureContext = createContext<{
  isInsideRenderTexture: boolean
  isPlaying: boolean
}>({
  isInsideRenderTexture: false,
  isPlaying: true
})

export const useRenderTexture = () => {
  return useContext(renderTextureContext)
}

export type TextureRenderCallback = (params: {
  elapsedTime: number
  state: RootState
  delta: number
  frame?: XRFrame
}) => void

export const useTextureFrame = (
  callback: TextureRenderCallback,
  priority?: number
) => {
  const { isPlaying } = useRenderTexture()

  const elapsedTimeRef = useRef(0)
  useFrame((state, delta, frame) => {
    if (!isPlaying) return
    elapsedTimeRef.current += delta
    callback({
      elapsedTime: elapsedTimeRef.current,
      state,
      delta,
      frame
    })
  }, priority)
}

export const RenderTexture = ({
  isPlaying: _playing = true,
  width = 1000,
  height = 1000,
  attach,
  fbo: _fbo,
  onMapTexture,
  onDepthTexture,
  containerScene,
  children,
  useGlobalPointer,
  renderPriority
}: PropsWithChildren<PaintCanvasProps>) => {
  // once the canvas is loaded, force render

  const fbo = useMemo(() => {
    const fbo =
      _fbo ||
      new THREE.WebGLRenderTarget(width, height, {
        samples: 8,
        stencilBuffer: true,
        depthTexture: new THREE.DepthTexture(
          width,
          height,
          THREE.UnsignedInt248Type
        ),
        format: RGBAFormat
      })
    return fbo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_fbo])

  useEffect(() => {
    if (onMapTexture) {
      onMapTexture(fbo.texture)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbo.texture])

  useEffect(() => {
    if (onDepthTexture) {
      onDepthTexture(fbo.depthTexture)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbo.depthTexture])

  const portalScene = useMemo(() => {
    return containerScene || new Scene()
  }, [containerScene])

  const isPlayingRef = useRef(_playing)
  const [isPlaying, setIsPlaying] = useState(_playing)

  const viewportSize = useThree((state) => state.size)
  const viewportSizeRef = useRef(viewportSize)
  viewportSizeRef.current = viewportSize

  useEffect(() => {
    fbo.setSize(width, height)
    const abortController = new AbortController()
    const signal = abortController.signal

    setIsPlaying(true)
    isPlayingRef.current = true
    if (_playing) return
    setTimeout(() => {
      if (signal.aborted) return
      setIsPlaying(false)
      isPlayingRef.current = false
    }, 100)

    return () => {
      abortController.abort()
    }
  }, [fbo, _playing, width, height, setIsPlaying])

  /** UV compute function relative to the viewport */
  const viewportUvCompute = useCallback(
    (event: DomEvent, state: RootState) => {
      if (!isPlayingRef.current) return
      if (!viewportSizeRef.current) return
      const { width, height, left, top } = viewportSizeRef.current
      const x = event.clientX - left
      const y = event.clientY - top
      state.pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
      state.raycaster.setFromCamera(state.pointer, state.camera)
    },
    [viewportSizeRef, isPlayingRef]
  )

  /** UV compute relative to the parent mesh UV */
  const uvCompute = useCallback(
    (event: DomEvent, state: RootState, previous: RootState) => {
      if (!isPlayingRef.current) return

      // Since this is only a texture it does not have an easy way to obtain the parent, which we
      // need to transform event coordinates to local coordinates. We use r3f internals to find the
      // next Object3D.
      let parent = (fbo.texture as any)?.__r3f.parent
      while (parent && !(parent instanceof THREE.Object3D)) {
        parent = parent.__r3f.parent
      }
      if (!parent) return false
      // First we call the previous state-onion-layers compute, this is what makes it possible to nest portals
      if (!previous.raycaster.camera) {
        previous.events.compute?.(
          event,
          previous,
          previous.previousRoot?.getState()
        )
      }
      // We run a quick check against the parent, if it isn't hit there's no need to raycast at all
      const [intersection] = previous.raycaster.intersectObject(parent)

      if (!intersection) return false
      // We take that hits uv coords, set up this layers raycaster, et voilà, we have raycasting on arbitrary surfaces
      const uv = intersection.uv
      if (!uv) return false
      state.raycaster.setFromCamera(
        state.pointer.set(uv.x * 2 - 1, uv.y * 2 - 1),
        state.camera
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <>
      <renderTextureContext.Provider
        value={{
          isInsideRenderTexture: true,
          isPlaying
        }}
      >
        {createPortal(
          <SceneContainer fbo={fbo} renderPriority={renderPriority}>
            {children}
            {/* Without an element that receives pointer events state.pointer will always be 0/0 */}
            <group onPointerOver={() => null} />
          </SceneContainer>,
          portalScene as any,
          {
            events: {
              compute: useGlobalPointer
                ? viewportUvCompute
                : (uvCompute as any),
              priority: 0
            }
          }
        )}
      </renderTextureContext.Provider>
      <primitive object={fbo.texture} attach={attach} />
    </>
  )
}

interface SceneContainerProps {
  fbo: THREE.WebGLRenderTarget
  renderPriority?: number
}

const SceneContainer = ({
  fbo,
  renderPriority,
  children
}: PropsWithChildren<SceneContainerProps>) => {
  useFrame((state) => {
    state.gl.setRenderTarget(fbo)
    state.gl.render(state.scene, state.camera)
    state.gl.setRenderTarget(null)
  }, renderPriority)

  return <>{children}</>
}
