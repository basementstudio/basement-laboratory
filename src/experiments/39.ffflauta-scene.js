import Image from 'next/image'
import { useCallback, useMemo, useState } from 'react'

import { FullHeightWrapper } from '~/components/common/aspect-canvas'
import { AspectBox } from '~/components/layout/aspect-box'
import { HTMLLayout } from '~/components/layout/html-layout'
import flautaTv from '~/public/images/ffflauta-scene/misc/flauta-tv.png'

import script from '../../public/data/ffflauta-script.json'

const thickness = 4

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

const Avatar = ({ src }) => {
  return (
    <Image
      width={64}
      height={64}
      style={{ userSelect: 'none' }}
      src={`/images/ffflauta-scene/avatars/${src}.png`}
    />
  )
}

const Dialog = ({ text }) => {
  return (
    <div
      style={{
        minWidth: 120,
        maxWidth: 160,
        width: 'max-content',
        minHeight: 30,
        height: 'auto',
        position: 'relative',
        color: 'black'
      }}
    >
      <Corner
        bg="/images/ffflauta-scene/misc/flauta-dialog-top-left.png"
        style={{ position: 'absolute', left: 0, top: 0 }}
      />
      <Corner
        bg="/images/ffflauta-scene/misc/flauta-dialog-top-right.png"
        style={{ position: 'absolute', right: 0, top: 0 }}
      />
      <Corner
        bg="/images/ffflauta-scene/misc/flauta-dialog-bottom-left.png"
        style={{ position: 'absolute', left: 0, bottom: 0 }}
      />
      <Corner
        bg="/images/ffflauta-scene/misc/flauta-dialog-bottom-right.png"
        style={{ position: 'absolute', right: 0, bottom: 0 }}
      />
      <Border
        direction="vertical"
        style={{ left: 0, bottom: 0 }}
        bg="/images/ffflauta-scene/misc/flauta-dialog-left.png"
      />
      <Border
        direction="vertical"
        style={{ right: 0, bottom: 0 }}
        bg="/images/ffflauta-scene/misc/flauta-dialog-right.png"
      />
      <Border
        direction="horizontal"
        style={{ top: 0 }}
        bg="/images/ffflauta-scene/misc/flauta-dialog-top.png"
      />
      <Border
        direction="horizontal"
        style={{ bottom: 0 }}
        bg="/images/ffflauta-scene/misc/flauta-dialog-bottom.png"
      />

      <div
        style={{
          background: 'white',
          position: 'absolute',
          /* Give some inner offset to avoid dead pixels */
          inset: thickness - 2
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'block',
          padding: '8px 10px 8px 10px',
          minHeight: '100%',
          height: '100%'
        }}
      >
        <p
          style={{
            fontSize: 9,
            height: '100%',
            userSelect: 'none',
            textTransform: 'lowercase'
          }}
        >
          {text}
        </p>
      </div>
    </div>
  )
}

const Background = ({ muted }) => {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ width: '100%', height: '100%' }}>
        <video
          onLoadStart={(e) => {
            e.target.volume = 0.5
          }}
          style={{ width: '100%' }}
          playsInline
          autoPlay
          src="/video/ffflauta-scene/tv-bg.mp4"
          muted={muted}
          loop
        />
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
            display: 'flex',
            imageRendering: 'pixelated'
          }}
        >
          {children}
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Image src={flautaTv} layout="responsive" />
      </div>
    </>
  )
}

const FFFlautaScene = () => {
  const [hasInteracted, setHasInteracted] = useState(false)
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
  const dialogLeftAvatar = dialog[1]['char-left']
  const dialogRightAvatar = dialog[1]['char-right']
  const curtainText = dialog[1]['text']

  const isCurtain = curtainText

  return (
    <FullHeightWrapper>
      <AspectBox
        style={{ fontFamily: 'Ffflauta', fontWeight: 500 }}
        ratio={21 / 9}
        onClick={() => {
          handleNextScene()
          setHasInteracted(true)
        }}
      >
        <TV>
          <Background muted={!hasInteracted} />
          <div style={{ position: 'absolute', top: '10%', right: '10%' }}>
            <p>
              {scene + 1}/{parsedScript.length}
            </p>
          </div>
          {isCurtain ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                position: 'absolute',
                inset: 0,
                background: '#373737'
              }}
            >
              <p style={{ fontSize: 12, textTransform: 'lowercase' }}>
                {curtainText}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                width: '100%',
                gridTemplateColumns: '1fr 1fr',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                background: 'black',
                padding: '10% 5%'
              }}
            >
              {dialogLeftAvatar && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    flexDirection: 'column',
                    gridColumn: 1
                  }}
                >
                  {dialogLeft && <Dialog text={dialogLeft} />}
                  <div style={{ marginTop: 10 }}>
                    <Avatar src={dialogLeftAvatar} />
                  </div>
                </div>
              )}
              {dialogRightAvatar && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    flexDirection: 'column',
                    gridColumn: 2
                  }}
                >
                  {dialogRight && <Dialog text={dialogRight} />}
                  <div style={{ marginTop: 10 }}>
                    <Avatar src={dialogRightAvatar} />
                  </div>
                </div>
              )}
            </div>
          )}
        </TV>
      </AspectBox>
    </FullHeightWrapper>
  )
}

FFFlautaScene.Title = 'FFFlauta Scene'
FFFlautaScene.Layout = HTMLLayout
FFFlautaScene.Tags = 'private'

export default FFFlautaScene
