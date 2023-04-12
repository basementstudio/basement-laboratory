import { Loader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import { model } from '~/lib/builders/model'

const BOX = model('box.glb', {
  scale: 0.6,
  ambientLight: 0.1,
  background: '#000',
  environment: 'sunset'
})

BOX.Layout = (props) => <R3FCanvasLayout {...props} htmlChildren={<Loader />} />
BOX.Title = 'Normals & HDRI Hologram'
BOX.Tags = '3d'

export default BOX
