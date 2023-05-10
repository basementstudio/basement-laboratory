import { HTMLLayout } from '../components/layout/html-layout'

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

JustATest.Layout = HTMLLayout

export const title = 'Just an HTML (example)'
JustATest.Tags = 'example'

export default JustATest
