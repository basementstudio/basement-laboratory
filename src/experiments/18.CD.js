import { model } from '~/lib/builders/model'

const CD = model(
  { path: 'cd.glb', environment: 'test.hdri.1.hdr' },
  {
    scale: 0.6,
    ambientLight: 0.1,
    background: '#000',
    environment: 'sunset'
  }
)

CD.Title = 'CD founded under the desk'
CD.Tags = '3d'

export default CD
