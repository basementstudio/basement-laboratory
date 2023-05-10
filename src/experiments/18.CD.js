import { model } from '~/lib/builders/model'

const CD = model('cd.glb', {
  scale: 0.6,
  ambientLight: 0.1,
  background: '#000',
  environment: 'sunset'
})

export const title = 'CD found under the desk'
export const tags = ['3d']

export default CD
