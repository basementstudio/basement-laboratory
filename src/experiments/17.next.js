import { model } from '~/lib/builders/model'

const nextJS = model('next.glb', {
  scale: 1.4,
  ambientLight: 0.1,
  background: '#000',
  environment: 'sunset'
})

export const title = 'Next.js 3d model'
export const tags = ['3d', 'private']

export default nextJS
