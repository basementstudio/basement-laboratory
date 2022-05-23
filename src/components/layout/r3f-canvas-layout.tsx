import { Canvas } from '@react-three/fiber'

import NavigationLayout from './navigation-layout'

export const R3FCanvasLayout = ({
  children,
  ...rest
}: {
  children?: React.ReactNode
}) => {
  return (
    <NavigationLayout>
      <Canvas {...rest}>{children}</Canvas>
    </NavigationLayout>
  )
}
