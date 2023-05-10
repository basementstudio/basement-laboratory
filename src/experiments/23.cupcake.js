import { model } from '~/lib/builders/model'

const cupcake = model('cupcake.glb', {
  scale: 0.6,
  ambientLight: 0.1,
  background: '#FFF',
  environment: 'dawn'
})

export const title = '3D Cupcake'
cupcake.Tags = '3d'

export default cupcake
