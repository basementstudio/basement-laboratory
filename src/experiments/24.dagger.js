import { Loader } from '~/components/common/loader'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import { model } from '~/lib/builders/model'

const dagger = model('dagger.glb', {
  scale: 0.6,
  ambientLight: 0.1,
  background: '#000',
  environment: 'dawn'
})

dagger.Layout = (props) => <R3FCanvasLayout {...props} htmlChildren={<Loader />} />
dagger.Title = 'Num Num Num 3D dagger'
dagger.Tags = '3d, private'

export default dagger

