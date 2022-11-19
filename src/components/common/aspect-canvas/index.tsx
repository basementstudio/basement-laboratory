import { Canvas, RenderProps } from '@react-three/fiber'
import { FC, Fragment, ReactNode } from 'react'

import { AspectBox } from '~/components/layout/aspect-box'

export const FullHeightWrapper: FC<{
  children: ReactNode
  fixed?: boolean
}> = ({ children, fixed = true }) => (
  <div
    style={{
      position: fixed ? 'fixed' : 'static',
      display: 'flex',
      height: '100vh',
      width: '100%',
      alignItems: 'center'
    }}
  >
    {children}
  </div>
)

export const AspectCanvas: FC<{
  children: ReactNode
  config: RenderProps<never> | undefined
  ratio: number
  fullHeight?: boolean
}> = ({ children, config, ratio: aspect, fullHeight = true }) => {
  const Wrapper = fullHeight ? FullHeightWrapper : Fragment

  return (
    <Wrapper>
      <AspectBox style={{ position: 'relative', width: '100%' }} ratio={aspect}>
        <Canvas style={{ position: 'absolute', inset: 0 }} {...config}>
          {children}
        </Canvas>
      </AspectBox>
    </Wrapper>
  )
}
