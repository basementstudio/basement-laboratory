import { ScrollProvider } from '@basementstudio/definitive-scroll'
import React, { FC } from 'react'

import { NavigationLayout, NavigationLayoutProps } from './navigation-layout'

export const SmoothScrollLayout: FC<NavigationLayoutProps> = ({
  children,
  slug,
  description,
  title
}) => (
  <NavigationLayout slug={slug} description={description} title={title}>
    <ScrollProvider>{children}</ScrollProvider>
  </NavigationLayout>
)
