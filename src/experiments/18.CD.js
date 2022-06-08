import { Loader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import { model } from '~/lib/builders/model'

const CD = model('cd.glb', {
  scale: 0.7,
  ambientLight: 0.1,
  background: '#000',
  environment: 'sunset'
})

CD.Layout = (props) => <R3FCanvasLayout {...props} htmlChildren={<Loader />} />
CD.Title = 'CD founded under the desk'
CD.Tags = '3d'

export default CD
