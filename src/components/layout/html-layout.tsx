import { FC } from 'react'

import { NavigationLayout, NavigationLayoutProps } from './navigation-layout'

export const HTMLLayout: FC<NavigationLayoutProps> = ({
  children,
  title,
  description,
  slug
}) => {
  return (
    <>
      <NavigationLayout title={title} description={description} slug={slug}>
        {children}
      </NavigationLayout>
    </>
  )
}
