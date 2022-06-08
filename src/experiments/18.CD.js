import { model } from '~/lib/builders/model'

const CD = model('cd.glb', {
  scale: 1.4,
  ambientLight: 0.2,
  background: '#000',
  environment: 'sunset'
})

CD.Title = 'CD founded under the desk'
CD.Tags = '3d'

export default CD
