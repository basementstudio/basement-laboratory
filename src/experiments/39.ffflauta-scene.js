import { gsap } from 'lib/gsap'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { FullHeightWrapper } from '~/components/common/aspect-canvas'
import { AspectBox } from '~/components/layout/aspect-box'
import { HTMLLayout } from '~/components/layout/html-layout'
import flautaTv from '~/public/images/ffflauta-scene/misc/flauta-tv.png'
import flautaTvScanline1 from '~/public/images/ffflauta-scene/misc/flauta-tv-grunge_01.png'
import flautaTvScanline2 from '~/public/images/ffflauta-scene/misc/flauta-tv-grunge_02.png'

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
  const videoRef = useRef()

  useEffect(() => {
    if (!muted) {
      gsap.to(videoRef.current, {
        volume: 0.5,
        duration: 1,
        ease: 'none'
      })
    }
  }, [muted])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ width: '100%', height: '100%' }}>
        <video
          onLoadStart={(e) => {
            e.target.volume = 0
          }}
          style={{ width: '100%' }}
          playsInline
          autoPlay
          src="/video/ffflauta-scene/tv-bg.mp4"
          muted={muted}
          loop
          ref={videoRef}
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
          className="tv-screen"
          style={{
            gridColumn: '2',
            aspectRatio: 1.35,
            padding: '0 30px',
            transform: 'translateY(-1%)',
            display: 'flex',
            imageRendering: 'pixelated',
            border: '1px solid red'
          }}
        >
          {children}
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Image src={flautaTv} layout="responsive" />
      </div>

      <style jsx>
        {`
          .tv-screen {
            opacity: 1;
            animation: tv-screen 0.1s linear infinite;
          }

          @keyframes tv-screen {
            0% {
              opacity: 1;
            }

            50% {
              opacity: 0.925;
            }

            100% {
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  )
}

const ScanLines = () => {
  return (
    <>
      <div className="scanlines-container">
        <div className="tv-scanline tv-scanline-1">
          <div>
            <Image src={flautaTvScanline1} />
          </div>
        </div>
        <div className="tv-scanline tv-scanline-2">
          <div>
            <Image src={flautaTvScanline2} />
          </div>
        </div>
      </div>
      <style jsx>{`
        .scanlines-container {
          position: absolute;
          inset: 0;
          zindex: 1;
          opacity: 0.45;
        }

        .tv-scanline {
          position: absolute;
          height: 100%;
        }

        .tv-scanline-1 {
          animation: scanline-translate-inverted 16s ease-in-out infinite;
        }

        .tv-scanline-2 {
          animation: scanline-translate 16s ease-in-out infinite;
        }

        .tv-scanline-1 > div,
        .tv-scanline-2 > div {
          animation: scanline1 0.1s steps(2) infinite;
        }

        @keyframes scanline-translate {
          0% {
            transform: translateY(0%);
          }
          50% {
            transform: translateY(100%);
          }
          100% {
            transform: translateY(0%);
          }
        }

        @keyframes scanline-translate-inverted {
          0% {
            transform: translateY(100%);
          }
          50% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes scanline1 {
          0% {
            transform: scale(1, 1);
          }

          50% {
            transform: scale(-1, 1);
          }

          100% {
            transform: scale(-1, 1);
          }
        }

        @keyframes scanline2 {
          0% {
            transform: rotate(0deg);
          }

          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  )
}

const FFFlautaScene = () => {
  const [hasInteracted, setHasInteracted] = useState(false)
  const [scene, setScene] = useState(0)

  const interactionAudio = useMemo(() => {
    const audio = new Audio('/audio/ffflauta-interaction.mp3')

    audio.volume = 1

    return audio
  }, [])

  const parsedScript = useMemo(() => Object.entries(script), [])

  const handleNextScene = useCallback(
    (step = 1) => {
      setScene((scene) => {
        return parsedScript[scene + step] ? scene + step : 0
      })

      interactionAudio.pause()
      interactionAudio.currentTime = 0
      interactionAudio.play()
    },
    [parsedScript, interactionAudio]
  )

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
        style={{ fontFamily: 'Ffflauta', fontWeight: 500, userSelect: 'none' }}
        ratio={21 / 9}
        onClick={() => {
          handleNextScene()
          setHasInteracted(true)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          handleNextScene(-1)
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
          <ScanLines />
        </TV>
      </AspectBox>
    </FullHeightWrapper>
  )
}

FFFlautaScene.Title = 'FFFlauta Scene'
FFFlautaScene.Layout = HTMLLayout
FFFlautaScene.Tags = 'private'

export default FFFlautaScene
