import { Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { FC } from 'react'

import { NavigationLayout, NavigationLayoutProps } from '../navigation-layout'
import s from './r3f-canvas-layout.module.scss'

export const R3FCanvasLayout: FC<NavigationLayoutProps> = ({
  children,
  title,
  description,
  ...rest
}) => {
  return (
    <NavigationLayout title={title} description={description}>
      <Canvas {...rest}>
        <Stats className={s['stats']} />
        {children}
      </Canvas>
    </NavigationLayout>
  )
}
