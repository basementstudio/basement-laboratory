import { FC } from 'react'

import { NavigationLayout, NavigationLayoutProps } from './navigation-layout'

export const PlainCanvasLayout: FC<NavigationLayoutProps> = ({
  children,
  title,
  description,
  slug
}) => {
  return (
    <NavigationLayout title={title} description={description} slug={slug}>
      <canvas
        id="webgl"
        style={{ position: 'fixed', width: '100vw', height: '100vh' }}
      />
      {children}
    </NavigationLayout>
  )
}
