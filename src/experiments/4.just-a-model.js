import { model } from '~/lib/builders/model'

const JustAModel = model('BasementLogo_Short.glb', {
  scale: 2
})

export const title = 'This is just a model (example)'
JustAModel.Description =
  'This is the simplest possible example of a model experiment.'
JustAModel.Tags = 'example'

export default JustAModel
