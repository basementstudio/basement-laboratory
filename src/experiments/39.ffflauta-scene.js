import Image from 'next/image'
import { useCallback, useMemo, useState } from 'react'

import { FullHeightWrapper } from '~/components/common/aspect-canvas'
import { AspectBox } from '~/components/layout/aspect-box'
import { HTMLLayout } from '~/components/layout/html-layout'
import flautaBg from '~/public/images/flauta-bg.png'

import script from '../../public/data/ffflauta-script.json'

const thickness = 12

const Border = ({ bg, style, direction }) => {
  return (
    <span
      style={{
        display: 'block',
        position: 'absolute',
        width: direction === 'vertical' ? `${thickness}px` : '100%',
        height: direction === 'vertical' ? '100%' : `${thickness}px`,
        padding:
          direction === 'vertical' ? `${thickness}px 0` : `0 ${thickness}px`,
        ...style
      }}
    >
      <span
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundImage: `url(${bg})`,
          backgroundRepeat: direction === 'vertical' ? 'repeat-y' : 'repeat-x',
          backgroundSize: '100% 100%',
          imageRendering: 'pixelated'
        }}
      />
    </span>
  )
}

const Corner = ({ bg, style }) => {
  return (
    <span
      style={{
        display: 'block',
        position: 'absolute',
        width: `${thickness}px`,
        aspectRatio: 1,
        ...style
      }}
    >
      <span
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundImage: `url(${bg})`,
          backgroundSize: '100% 100%',
          imageRendering: 'pixelated'
        }}
      />
    </span>
  )
}

const Dialog = ({ text }) => {
  return (
    <div
      style={{
        minWidth: 120,
        maxWidth: 160,
        width: 'max-content',
        minHeight: 60,
        height: 'auto',
        position: 'relative',
        color: 'black'
      }}
    >
      <Corner
        bg="/images/flauta-dialog-top-left.png"
        style={{ position: 'absolute', left: 0, top: 0 }}
      />
      <Corner
        bg="/images/flauta-dialog-top-right.png"
        style={{ position: 'absolute', right: 0, top: 0 }}
      />
      <Corner
        bg="/images/flauta-dialog-bottom-left.png"
        style={{ position: 'absolute', left: 0, bottom: 0 }}
      />
      <Corner
        bg="/images/flauta-dialog-bottom-right.png"
        style={{ position: 'absolute', right: 0, bottom: 0 }}
      />
      <Border
        direction="vertical"
        style={{ left: 0, bottom: 0 }}
        bg="/images/flauta-dialog-left.png"
      />
      <Border
        direction="vertical"
        style={{ right: 0, bottom: 0 }}
        bg="/images/flauta-dialog-right.png"
      />
      <Border
        direction="horizontal"
        style={{ top: 0 }}
        bg="/images/flauta-dialog-top.png"
      />
      <Border
        direction="horizontal"
        style={{ bottom: 0 }}
        bg="/images/flauta-dialog-bottom.png"
      />

      <div
        style={{
          background: 'white',
          position: 'absolute',
          inset: thickness
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'block',
          padding: '8px 10px 11px 10px',
          minHeight: '100%',
          height: '100%'
        }}
      >
        <p
          style={{
            fontSize: 10,
            height: '100%',
            fontFamily: 'Ffflauta',
            fontWeight: 500,
            userSelect: 'none'
          }}
        >
          {text}
        </p>
      </div>
    </div>
  )
}

const TV = ({ children }) => {
  return (
    <>
      <div
        style={{
          display: 'grid',
          width: '100%',
          height: '100%',
          gridTemplateColumns: '1.075fr 0.94fr 1fr',
          alignContent: 'center'
        }}
      >
        <div
          style={{
            gridColumn: '2',
            aspectRatio: 1.35,
            padding: '0 30px',
            transform: 'translateY(-1%)',
            display: 'flex'
          }}
        >
          {children}
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Image src={flautaBg} layout="responsive" />
      </div>
    </>
  )
}

const FFFlautaScene = () => {
  const [scene, setScene] = useState(0)

  const parsedScript = useMemo(() => Object.entries(script), [])

  const handleNextScene = useCallback(() => {
    setScene((scene) => {
      return parsedScript[scene + 1] ? scene + 1 : 0
    })
  }, [parsedScript])

  const dialog = parsedScript[scene]

  const dialogLeft = dialog[1]['dialog-left']
  const dialogRight = dialog[1]['dialog-right']

  console.log({ scene, dialog })

  return (
    <FullHeightWrapper>
      <AspectBox ratio={21 / 9} onClick={handleNextScene}>
        <TV>
          <div
            style={{
              width: '100%',
              justifySelf: 'flex-end',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              background: 'black',
              paddingBottom: '6%'
            }}
          >
            {dialogLeft && (
              <div>
                <Dialog text={dialogLeft} />
              </div>
            )}
            {dialogRight && (
              <div>
                <Dialog text={dialogRight} />
              </div>
            )}
          </div>
        </TV>
      </AspectBox>
    </FullHeightWrapper>
  )
}

FFFlautaScene.Title = 'FFFlauta Scene'
FFFlautaScene.Layout = HTMLLayout
FFFlautaScene.tags = 'private'

export default FFFlautaScene
