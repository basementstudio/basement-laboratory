import React from 'react'

import { NavigationLayout } from '../components/layout/navigation-layout'

const JustATest = () => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <p>Hi there!</p>
    </div>
  )
}

JustATest.getLayout = ({ Component, title, description, slug }) => {
  return (
    <>
      <NavigationLayout title={title} description={description} slug={slug}>
        <Component />
      </NavigationLayout>
    </>
  )
}

JustATest.Title = 'Just an HTML (example)'
JustATest.Tags = 'example'

export default JustATest
