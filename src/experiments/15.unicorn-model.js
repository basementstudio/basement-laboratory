import { model } from '~/lib/builders/model'

const Unicorn = model('Unicorn_v3.gltf', {
  scale: 1.4,
  ambientLight: 0.1,
  background: '#666',
  environment: 'sunset'
})

export const title = 'This is a Unicorn'
export const tags = ['3d']

export default Unicorn
