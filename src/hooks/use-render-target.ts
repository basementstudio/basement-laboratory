import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

export const useRenderTargets = (
  count: number,
  config: THREE.WebGLRenderTargetOptions
) => {
  const windowSize = useThree((s) => s.size)
  const renderTargets = useMemo(() => {
    return new Array(count)
      .fill(null)
      .map(
        () =>
          new THREE.WebGLRenderTarget(
            windowSize.width,
            windowSize.height,
            config
          )
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, config])

  useEffect(() => {
    renderTargets.forEach((rt) => {
      rt.setSize(windowSize.width, windowSize.height)
    })
  }, [renderTargets, windowSize])

  return renderTargets
}
