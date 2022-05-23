import { model } from '~/lib/builders'

const JustAModel = model('BasementLogo_Short.glb', {
  scale: 2
})

JustAModel.Title = 'This is just a model'
JustAModel.Description =
  'This is the simplest possible example of a model experiment.'

export default JustAModel
