import { model } from '~/lib/builders/model'

const nextJS = model('next.glb', {
  scale: 1.4,
  ambientLight: 0.1,
  background: '#000',
  environment: 'sunset'
})

nextJS.Title = 'Next.js 3d model'
nextJS.Tags = '3d'

export default nextJS
