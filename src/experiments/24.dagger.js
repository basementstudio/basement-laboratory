import { model } from '~/lib/builders/model'

const dagger = model('dagger.glb', {
  scale: 0.6,
  ambientLight: 0.1,
  background: '#000',
  environment: 'dawn'
})

export const title = 'Dagger'
export const tags = ['3d', ' private']

export default dagger
