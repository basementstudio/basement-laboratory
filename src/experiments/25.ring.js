import { model } from '~/lib/builders/model'

const ring = model('ring.glb', {
  scale: 0.6,
  ambientLight: 0.1,
  background: '#000',
  environment: 'dawn'
})

export const title = 'The Ring'
ring.Tags = '3d, private'

export default ring
