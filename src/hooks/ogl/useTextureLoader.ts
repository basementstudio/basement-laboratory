import { Texture } from 'ogl'
import { useOGL } from 'react-ogl/web'
import { suspend } from 'suspend-react'

export default function useTextureLoader(textureUrl: string) {
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
        image
      })

      return texture
    },
    [textureUrl]
  )
}
