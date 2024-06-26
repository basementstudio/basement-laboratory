import { Stats } from '@react-three/drei'
import { Canvas, Props } from '@react-three/fiber'
import { FC, ReactNode, Suspense } from 'react'

import { LoadingScreen } from '~/components/common/loader'

import { NavigationLayout, NavigationLayoutProps } from '../navigation-layout'
import s from './r3f-suspense-layout.module.scss'

type R3FSuspenseLayoutProps = NavigationLayoutProps & {
  htmlChildren?: ReactNode
} & Props

export const R3FSuspenseLayout: FC<R3FSuspenseLayoutProps> = ({
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
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      </div>
      <LoadingScreen />
    </NavigationLayout>
  )
}
