declare module 'ogl' {
  type OGLRenderingContext = {
    renderer: Renderer
    canvas: HTMLCanvasElement
  } & (WebGL2RenderingContext | WebGLRenderingContext)
  interface TextureOptions {
    image:
      | HTMLImageElement
      | HTMLVideoElement
      | HTMLImageElement[]
      | ArrayBufferView
    target: number // gl.TEXTURE_2D or gl.TEXTURE_CUBE_MAP
    type: number // gl.UNSIGNED_BYTE,
    format: number // gl.RGBA,
    internalFormat: number
    wrapS: number
    wrapT: number
    generateMipmaps: boolean
    minFilter: number
    magFilter: number
    premultiplyAlpha: boolean
    unpackAlignment: number
    flipY: boolean
    level: number
    width: number
    height: number
    anisotropy: number
  }
  export class Texture {
    constructor(gl: OGLRenderingContext, opts: Partial<TextureOptions> = {})

    bind(...args: any[]): void

    update(...args: any[]): void
  }
}
