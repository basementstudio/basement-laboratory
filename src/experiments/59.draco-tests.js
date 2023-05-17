import { Script } from '~/components/common/script'
import { PlainCanvasLayout } from '~/components/layout/plain-canvas-layout'

const fn = () => {
  const libs = [
    'https://www.gstatic.com/draco/versioned/decoders/1.4.1/draco_wasm_wrapper.js',
    'https://www.gstatic.com/draco/versioned/decoders/1.4.1/draco_decoder.wasm'
  ]

  Promise.all(
    libs.map((lib, idx) =>
      fetch(lib).then((response) => {
        if (idx === 0) {
          return response.text()
        }
        return response.arrayBuffer()
      })
    )
  ).then((libs) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.innerHTML = libs[0]
    document.body.appendChild(script)

    let decoderModule

    function createDracoDecoderModule() {
      let dracoDecoderType = {
        wasmBinary: libs[1]
      }

      decoderModule = new Promise((resolve) => {
        dracoDecoderType['onModuleLoaded'] = function (module) {
          resolve(module)
        }

        window?.DracoDecoderModule(dracoDecoderType)
      })
    }

    createDracoDecoderModule()

    fetch('/models/screen.bin')
      .then((response) => response.arrayBuffer())
      .then((dracoBuffer) => {
        const decoder = new TextDecoder(),
          jsonSize = parseInt(decoder.decode(dracoBuffer.slice(0, 10))),
          jsonData = JSON.parse(
            decoder.decode(dracoBuffer.slice(10, 10 + jsonSize))
          ),
          buffer = dracoBuffer.slice(10 + jsonSize)

        console.log(jsonData)

        decoderModule
          .then((draco) => {
            const decoder = new draco.Decoder(),
              decoderBuffer = new draco.DecoderBuffer()
            decoderBuffer.Init(new Int8Array(buffer), buffer.byteLength)

            const dracoGeometry = new draco.Mesh()
            const decodingStatus = decoder.DecodeBufferToMesh(
              decoderBuffer,
              dracoGeometry
            )

            if (!decodingStatus.ok() || dracoGeometry.ptr == 0) {
              console.error('decoding failed')
              return
            }

            const attrId = decoder.GetAttributeId(dracoGeometry, 'position')
            const attribute = decoder.GetAttribute(dracoGeometry, attrId)

            console.log(attribute)
          })
          .catch((err) => {
            console.log(err)
          })
      })
  })

  return () => {
    console.log('bye')
  }
}

const DracoTests = () => {
  return (
    <>
      <Script fn={fn} />
    </>
  )
}

DracoTests.Layout = PlainCanvasLayout
DracoTests.Title = 'Draco Tests'
DracoTests.Description = 'Draco Tests'

export default DracoTests
