import { Loader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import { model } from '~/lib/builders/model'

const ring = model('ring.glb', {
  scale: 0.6,
  ambientLight: 0.1,
  background: '#000',
  environment: 'dawn'
})

ring.Layout = (props) => <R3FCanvasLayout {...props} htmlChildren={<Loader />} />
ring.Title = 'The Ring'
ring.Tags = '3d, private'

export default ring

