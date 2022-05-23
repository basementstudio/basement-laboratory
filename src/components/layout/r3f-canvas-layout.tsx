import { Canvas } from '@react-three/fiber'
import { FC } from 'react'

import { NavigationLayout, NavigationLayoutProps } from './navigation-layout'

export const R3FCanvasLayout: FC<NavigationLayoutProps> = ({
  children,
  title,
  description,
  ...rest
}) => {
  return (
    <NavigationLayout title={title} description={description}>
      <Canvas {...rest}>{children}</Canvas>
    </NavigationLayout>
  )
}
