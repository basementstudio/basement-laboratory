import { Loader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import { model } from '~/lib/builders/model'

const cupcake = model('cupcake.glb', {
  scale: 0.6,
  ambientLight: 0.1,
  background: '#FFF',
  environment: 'dawn'
})

cupcake.Layout = (props) => <R3FCanvasLayout {...props} htmlChildren={<Loader />} />
cupcake.Title = 'Num Num Num 3D Cupcake'
cupcake.Tags = '3d'

export default cupcake
