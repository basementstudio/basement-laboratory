import { Howl } from 'howler'
import { gsap } from 'lib/gsap'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { FullHeightWrapper } from '~/components/common/aspect-canvas'
import { HTMLLayout } from '~/components/layout/html-layout'
import { useGsapContext } from '~/hooks/use-gsap-context'
import arrowLeft from '~/public/images/ffflauta-scene/misc/flauta-dialog-arrow-left.png'
import arrowRight from '~/public/images/ffflauta-scene/misc/flauta-dialog-arrow-right.png'
import flautaTv from '~/public/images/ffflauta-scene/misc/flauta-tv.png'
import flautaTvScanline1 from '~/public/images/ffflauta-scene/misc/flauta-tv-grunge_01.png'
import flautaTvScanline2 from '~/public/images/ffflauta-scene/misc/flauta-tv-grunge_02.png'

import script from '../../public/data/ffflauta-script.json'

const thickness = 0.5 // on em

const Border = ({ bg, style, direction }) => {
  return (
    <span
      style={{
        display: 'block',
        position: 'absolute',
        zIndex: 1,
        width: direction === 'vertical' ? `${thickness}em` : '100%',
        height: direction === 'vertical' ? '100%' : `${thickness}em`,
        padding:
          direction === 'vertical' ? `${thickness}em 0` : `0 ${thickness}em`,
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
        zIndex: 1,
        width: `${thickness}em`,
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
      alt={`${src} avatar`}
      layout="responsive"
    />
  )
}

const Dialog = ({ text, side }) => {
  return (
    <div style={{ position: 'relative', width: '100%', textAlign: side }}>
      <div
        style={{
          display: 'inline-block',
          maxWidth: '95%',
          minWidth: '40%',
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
            inset: `calc(${thickness}em - 2px)`
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'block',
            padding: '0.8em 1em 0.8em 1em',
            minHeight: '100%',
            height: '100%'
          }}
        >
          <p
            style={{
              fontSize: '0.9em',
              height: '100%',
              textTransform: 'lowercase',
              textAlign: 'left'
            }}
          >
            {text}
          </p>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          height: '',
          zIndex: 10,
          bottom: 0,
          // 1px offset to avoid bleeding
          transform: 'translateY(calc(50% - 1px))',
          left: side === 'left' ? '22%' : undefined,
          right: side === 'right' ? '22%' : undefined,
          width: `${thickness}em`
        }}
      >
        {side === 'left' && <Image src={arrowLeft} layout="responsive" />}
        {side === 'right' && <Image src={arrowRight} layout="responsive" />}
      </div>
    </div>
  )
}

const Background = () => {
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
          muted={true}
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
          position: 'relative',
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
            transform: 'translateY(-1%)',
            imageRendering: 'pixelated'
          }}
        >
          {children}
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            width: '100%'
          }}
        >
          <Image src={flautaTv} layout="responsive" alt="tv scene" />
        </div>
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
            <Image src={flautaTvScanline1} alt="tv scanline" />
          </div>
        </div>
        <div className="tv-scanline tv-scanline-2" alt="tv scanline">
          <div>
            <Image src={flautaTvScanline2} />
          </div>
        </div>
      </div>
      <style jsx>{`
        .scanlines-container {
          pointer-events: none;
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

const AudioButton = ({ interacted }) => {
  const [muted, setMuted] = useState(false)

  const shouldBeMuted = !interacted || muted

  var music = useMemo(
    () =>
      new Howl({
        src: '/audio/flauta-loop.ogg',
        autoplay: true,
        loop: true,
        mute: true,
        volume: 0
      }),
    []
  )

  useEffect(() => {
    music.mute(shouldBeMuted)

    const fromTo = [0, 0.5]

    shouldBeMuted && fromTo.reverse()

    music.fade(...fromTo, 2000)

    if (!music.playing() && !shouldBeMuted) {
      music.play()
    }
  }, [music, shouldBeMuted])

  useEffect(() => {
    const musicRef = music

    return () => {
      musicRef.unload()
    }
  }, [music])

  const toggleMute = useCallback((e) => {
    e.stopPropagation()
    setMuted((muted) => !muted)
  }, [])

  return (
    <button
      style={{
        aspectRatio: 1,
        width: '8%',
        // background: '#00000060',
        pointerEvents: 'all'
        // mixBlendMode: 'multiply'
      }}
      onClick={toggleMute}
    >
      {shouldBeMuted ? (
        <svg
          width="100%"
          height="21"
          viewBox="0 0 21 21"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0px 0px 2px #000000)' }}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 2H8V4H6V6H4V8H0V13H4V15H6V17H8V19H10V2Z"
          />
        </svg>
      ) : (
        <svg
          width="100%"
          height="21"
          viewBox="0 0 21 21"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0px 0px 2px #000000)' }}
        >
          <rect x="14" y="7" width="2" height="7" />
          <rect x="19" y="5" width="2" height="11" />
          <rect x="12" y="5" width="2" height="2" />
          <rect x="17" y="3" width="2" height="2" />
          <rect x="12" y="14" width="2" height="2" />
          <rect x="17" y="16" width="2" height="2" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 2H8V4H6V6H4V8H0V13H4V15H6V17H8V19H10V2Z"
          />
        </svg>
      )}
    </button>
  )
}

const FFFlautaScene = () => {
  const [hasInteracted, setHasInteracted] = useState(false)
  const [scene, setScene] = useState(0)

  const contentRef = useRef()

  const interactionAudio = useMemo(() => {
    const audio = new Audio('/audio/ffflauta-interaction.mp3')

    audio.volume = 1

    return audio
  }, [])

  const parsedScript = useMemo(() => Object.entries(script), [])

  const handleNextScene = useCallback(
    (step = 1) => {
      setScene((scene) => {
        const hasNextScene = parsedScript[scene + step]

        if (hasNextScene) {
          interactionAudio.pause()
          interactionAudio.currentTime = 0
          interactionAudio.play()
        }

        return hasNextScene ? scene + step : scene
      })
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
  const isLastScene = scene === parsedScript.length - 1

  useGsapContext(() => {
    if (isLastScene) {
      gsap.to(contentRef.current, {
        opacity: 0,
        duration: 1,
        delay: 3
      })
    } else {
      gsap.set(contentRef.current, {
        opacity: 1
      })
    }
  }, [isLastScene])

  return (
    <FullHeightWrapper>
      <div
        style={{
          fontSize: 'max(6px, 0.6vw)',
          fontFamily: 'Ffflauta',
          fontWeight: 500,
          userSelect: 'none',
          minWidth: 780,
          position: 'relative',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          aspectRatio: 21 / 9
        }}
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
          <Background />
          {/* Content */}
          <div
            style={{
              padding: '0 6%',
              display: 'flex',
              width: '100%',
              height: '100%'
            }}
            ref={contentRef}
          >
            <div
              style={{
                position: 'absolute',
                top: '10%',
                left: 0,
                padding: '0 10%',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <AudioButton interacted={hasInteracted} />

              <p style={{ fontSize: '1.6em' }}>
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
                <p style={{ fontSize: '1.2em', textTransform: 'lowercase' }}>
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
                      position: 'relative',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      flexDirection: 'column',
                      gridColumn: 1
                    }}
                  >
                    {dialogLeft && <Dialog text={dialogLeft} side="left" />}
                    <div style={{ marginTop: '1.5em', width: '32%' }}>
                      <Avatar src={dialogLeftAvatar} />
                    </div>
                  </div>
                )}
                {dialogRightAvatar && (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-end',
                      flexDirection: 'column',
                      gridColumn: 2
                    }}
                  >
                    {dialogRight && <Dialog text={dialogRight} side="right" />}
                    <div style={{ marginTop: '1.5em', width: '32%' }}>
                      <Avatar src={dialogRightAvatar} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <ScanLines />
        </TV>
      </div>
    </FullHeightWrapper>
  )
}

FFFlautaScene.Title = 'FFFlauta Scene'
FFFlautaScene.Layout = HTMLLayout
FFFlautaScene.Tags = 'private'

export default FFFlautaScene
