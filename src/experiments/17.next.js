import { model } from '~/lib/builders/model'

const Unicorn = model('next.glb', {
  scale: 1.4,
  ambientLight: 0.1,
  background: '#000',
  environment: 'sunset'
})

Unicorn.Title = 'Next.js 3d model'
Unicorn.Tags = '3d'

export default Unicorn
