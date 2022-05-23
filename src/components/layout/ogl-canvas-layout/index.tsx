import { FC, Suspense } from 'react'
import { Canvas } from 'react-ogl/web'

import { NavigationLayout, NavigationLayoutProps } from '../navigation-layout'

export const OGLCanvasLayout: FC<NavigationLayoutProps> = ({
  children,
  title,
  description,
  slug,
  ...rest
}) => {
  return (
    <NavigationLayout title={title} description={description} slug={slug}>
      <Canvas {...rest}>
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </NavigationLayout>
  )
}
