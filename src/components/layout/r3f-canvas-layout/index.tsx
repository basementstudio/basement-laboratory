import { Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { FC, ReactNode } from 'react'

import { NavigationLayout, NavigationLayoutProps } from '../navigation-layout'
import s from './r3f-canvas-layout.module.scss'

type R3FCanvasLayoutProps = NavigationLayoutProps & {
  htmlChildren?: ReactNode
}

export const R3FCanvasLayout: FC<R3FCanvasLayoutProps> = ({
  children,
  title,
  description,
  slug,
  htmlChildren,
  ...rest
}) => {
  return (
    <NavigationLayout title={title} description={description} slug={slug}>
      {htmlChildren}
      <div style={{ position: 'fixed', height: '100vh', width: '100vw' }}>
        <Canvas {...rest}>
          <Stats className={s['stats']} />
          {children}
        </Canvas>
      </div>
    </NavigationLayout>
  )
}
