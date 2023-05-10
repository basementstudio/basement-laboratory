import { lottie } from '~/lib/builders/lottie'

import { NavigationLayout } from '../components/layout/navigation-layout'

const Lottie = lottie('Replay-hoverboard.json')

Lottie.getLayout = ({ Component, title, description, slug }) => {
  return (
    <>
      <NavigationLayout title={title} description={description} slug={slug}>
        <Component />
      </NavigationLayout>
    </>
  )
}

export const title = 'Lottie Hoverboard'
Lottie.Tags = 'lottie,animation'

export default Lottie
