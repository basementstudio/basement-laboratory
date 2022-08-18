import { model } from '~/lib/builders/model'

const CD = model('cd.glb', {
  scale: 0.6,
  ambientLight: 0.1,
  background: '#000',
  environment: 'sunset'
})

CD.Title = 'CD found under the desk'
CD.Tags = '3d'

export default CD
