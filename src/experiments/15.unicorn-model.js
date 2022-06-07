import { Environment } from '@react-three/drei'

import { model } from '~/lib/builders'

const Model = model('Unicorn_v3.gltf', {
  scale: 1.4,
  ambientLight: 0.1
})

const JustAModel = () => {
  return (
    <>
      <Environment preset="sunset" />
      <Model />
    </>
  )
}

JustAModel.Title = 'This is an Unicorn'

export default JustAModel
