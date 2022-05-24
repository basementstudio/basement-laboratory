import { Texture, TextureOptions } from 'ogl'
import { useOGL } from 'react-ogl/web'
import { suspend } from 'suspend-react'

type ImageTextureOptions = Omit<TextureOptions, 'image'>

export const useImageTextureLoader = (
  textureUrl: string,
  opts?: ImageTextureOptions
) => {
  const { gl } = useOGL()

  return suspend(
    async (url) => {
      const image = (await new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = ''
        img.onload = () => resolve(img)
        img.src = url
      })) as HTMLImageElement

      const texture = new Texture(gl, {
        image,
        ...opts
      })

      return texture
    },
    [textureUrl]
  )
}
