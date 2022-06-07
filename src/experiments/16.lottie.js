import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'

import { NavigationLayout } from '../components/layout/navigation-layout'

const Lottie = () => {
  const divRef = useRef()

  useEffect(() => {
    const animation = lottie.loadAnimation({
      container: divRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: require('../../public/lotties/Replay-hoverboard.json')
    })

    return () => {
      animation.destroy()
    }
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw'
      }}
    >
      <div style={{ width: '40vw', height: '40vh' }} ref={divRef} />
    </div>
  )
}

Lottie.getLayout = ({ Component, title, description, slug }) => {
  return (
    <>
      <NavigationLayout title={title} description={description} slug={slug}>
        <Component />
      </NavigationLayout>
    </>
  )
}

Lottie.Title = 'Lottie Hoverboard'

export default Lottie
