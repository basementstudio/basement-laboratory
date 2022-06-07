import { model } from '~/lib/builders/model'

const Unicorn = model('Unicorn_v3.gltf', {
  scale: 1.4,
  ambientLight: 0.1,
  background: '#666',
  environment: 'sunset'
})

Unicorn.Title = 'This is an Unicorn'

export default Unicorn
