import { createClient } from '@liveblocks/client'
import { useQRCode } from 'next-qrcode'
import { useCallback, useEffect, useState } from 'react'
import { useMobileOrientation } from 'react-device-detect'

import { NavigationLayout } from '../components/layout/navigation-layout'
import { useWebRTC } from '../hooks/use-web-rtc'
import { isClient, safeWindow } from '../lib/constants'

const hasControl = () => {
  if (!isClient) return

  const url = new URL(safeWindow.location.href)
  return url.searchParams.get('control')
}

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_API_KEY
})

const TrackPad = ({ onChange, coords }) => {
  const handleUpdate = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Get relative coords
    const rect = e.target.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const y = e.touches[0].clientY - rect.top
    onChange([x, y])
  }

  return (
    <div
      onTouchStart={handleUpdate}
      onTouchMove={handleUpdate}
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        border: '1px solid white'
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: coords[0],
          top: coords[1],
          display: 'inline-block',
          borderRadius: '50%',
          width: 50,
          height: 50,
          border: '1px solid white',
          transform: 'translate(-50%, -50%)',
          background: 'black'
        }}
      />
    </div>
  )
}

const Button = ({ active, style, ...rest }) => {
  return (
    <button
      style={{
        ...style,
        WebkitUserSelect: 'none',
        userSelect: 'none',
        width: '100%',
        height: '100%',
        color: active ? 'black' : 'white',
        display: 'block',
        background: active ? 'white' : 'black',
        border: '1px solid white'
      }}
      {...rest}
    />
  )
}

const ControlView = ({ controls }) => {
  return (
    <div
      style={{
        display: 'grid',
        height: '100%',
        width: '100%',
        gridTemplateColumns: 'auto 100px',
        gridTemplateRows: 'repeat(2, 1fr)'
      }}
    >
      <Button
        style={{ gridColumn: 2, gridRow: 1 }}
        active={controls?.a?.value}
        onTouchStart={() => controls?.a?.onChange(true)}
        onTouchEnd={() => controls?.a?.onChange(false)}
      >
        A
      </Button>
      <Button
        style={{ gridColumn: 2, gridRow: 2 }}
        active={controls?.b?.value}
        onTouchStart={() => controls?.b?.onChange(true)}
        onTouchEnd={() => controls?.b?.onChange(false)}
      >
        B
      </Button>
      <div style={{ gridColumn: 1, gridRow: '1/3' }}>
        <TrackPad
          coords={controls.trackpad.value}
          onChange={(coords) => controls.trackpad.onChange(coords)}
        />
      </div>
    </div>
  )
}

const PART_TYPE = hasControl() ? 'control' : 'receiver'
const IS_CONTROL = PART_TYPE === 'control'
const IS_RECEIVER = PART_TYPE === 'receiver'

const RemoteControl = ({ layoutProps }) => {
  const { Image } = useQRCode()
  const { isLandscape } = useMobileOrientation()
  const [controls, setControls] = useState({
    a: false,
    b: false,
    trackpad: [0, 0]
  })
  const [controller, setController] = useState(null)
  const [room, setRoom] = useState(null)
  const {
    send,
    initOffer,
    acceptOffer,
    answerOffer,
    addIceCandidate,
    addDataChannel,
    connection,
    channel
  } = useWebRTC()

  const onIceCandidate = useCallback(
    (e) => {
      if (!room || !e.candidate) {
        console.log('OnIceCandidate but returned', room, e.candidate)
        return
      }

      console.log('Sending ice candidate...')

      room.broadcastEvent({
        type: 'webrtc-ice-candidate',
        candidate: JSON.stringify(e.candidate)
      })
    },
    [room]
  )

  const setControl = useCallback(
    (targetControl) => (value) => {
      setControls((controls) => {
        return { ...controls, [targetControl]: value }
      })
    },
    [setControls]
  )

  useEffect(() => {
    if (IS_CONTROL && room) {
      send({ type: 'controls-update', controls })
    }
  }, [controls, send, room])

  useEffect(() => {
    if (!connection) return

    console.log('Adding on ice candidate listener')

    connection.addEventListener('icecandidate', onIceCandidate)
    connection.addEventListener('datachannel', addDataChannel)

    return () => {
      connection.removeEventListener('icecandidate', onIceCandidate)
      connection.removeEventListener('datachannel', addDataChannel)
    }
  }, [onIceCandidate, addDataChannel, connection])

  useEffect(() => {
    const onChannelOpen = () => {
      console.log('Channel opened!')
    }

    const onChannelClose = () => {
      console.log('Channel closed!')
    }

    const onChannelMessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'controls-update') {
        setControls(data.controls)
        console.log('Update controls!', data.controls)
      }
    }

    channel.addEventListener('open', onChannelOpen)
    channel.addEventListener('close', onChannelClose)
    channel.addEventListener('message', onChannelMessage)

    return () => {
      channel.removeEventListener('open', onChannelOpen)
      channel.removeEventListener('close', onChannelClose)
      channel.removeEventListener('message', onChannelMessage)
    }
  }, [channel])

  const connect = (roomId) => {
    let _room

    try {
      _room = client.enter(roomId, {
        initialPresence: { type: PART_TYPE }
      })

      if (IS_RECEIVER) {
        _room.subscribe('others', (others, event) => {
          const isSelf = () =>
            event.user.connectionId === _room.getSelf().connectionId

          if (event.type === 'enter') {
            if (!isSelf()) {
              initOffer().then((offer) => {
                _room.broadcastEvent({
                  type: 'webrtc-offer',
                  offer
                })
              })
              setController(event.user)
            }
          }

          if (event.type === 'leave') {
            if (!isSelf()) {
              if (others.count === 0) {
                setController(null)
              }
            }
          }
        })

        _room.subscribe('event', (event) => {
          if (event.event.type === 'controls-update') {
            setControls(event.event.controls)
            console.log('Update controls!', event.event.controls)
          }

          if (event.event.type === 'webrtc-ice-candidate') {
            addIceCandidate(event.event.candidate)
            console.log('Got ice candidate!', event.event.candidate)
          }

          if (event.event.type === 'webrtc-answer') {
            acceptOffer(event.event.answer)
            console.log('Answer received!', event.event.answer)
          }
        })
      } else if (IS_CONTROL) {
        _room.subscribe('event', (event) => {
          if (event.event.type === 'webrtc-offer') {
            answerOffer(event.event.offer).then((answer) => {
              _room.broadcastEvent({
                type: 'webrtc-answer',
                answer
              })
            })
          }

          if (event.event.type === 'webrtc-ice-candidate') {
            addIceCandidate(event.event.candidate)
            console.log('Got ice candidate!', event.event.candidate)
          }
        })
      }

      console.log('Room connection successful: ', _room)
      setRoom(_room)
    } catch (error) {
      console.log('Error connecting to room: ', error)
    }
  }

  useEffect(() => {
    let ROOM_ID

    if (IS_CONTROL) {
      const url = new URL(safeWindow.location.href)
      ROOM_ID = url.searchParams.get('control')

      connect(ROOM_ID)
    } else if (IS_RECEIVER) {
      fetch(`/api/21.remote-control/get-room`)
        .then((res) => res.json())
        .then((res) => {
          ROOM_ID = res.roomHash

          connect(ROOM_ID)
        })
    }

    return () => {
      client.leave(ROOM_ID)
    }
  }, [])

  const roomUrl =
    process.env.NEXT_PUBLIC_SITE_URL +
    '/experiments/21.remote-control.js?control=' +
    room?.id

  return IS_CONTROL ? (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {isLandscape ? (
        <>
          <ControlView
            controls={{
              a: { value: controls.a, onChange: setControl('a') },
              b: { value: controls.b, onChange: setControl('b') },
              trackpad: {
                value: controls.trackpad,
                onChange: setControl('trackpad')
              }
            }}
          />
        </>
      ) : (
        <div>Please flip your device</div>
      )}
    </div>
  ) : (
    <NavigationLayout {...layoutProps}>
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div
          onClick={() => {
            navigator.clipboard.writeText(roomUrl)
          }}
        >
          {room?.id && (
            <Image
              text={roomUrl}
              options={{
                type: 'image/jpeg',
                quality: 0.3,
                level: 'M',
                margin: 3,
                scale: 4,
                width: 200,
                color: {
                  dark: '#000',
                  light: '#fff'
                }
              }}
            />
          )}
        </div>
        <br />
        <div>{controller ? 'Has control' : 'Has no control'}</div>
        <br />
        <div style={{ width: '100%', height: 400, maxWidth: 700 }}>
          <ControlView
            controls={{
              a: { value: controls.a },
              b: { value: controls.b },
              trackpad: {
                value: controls.trackpad,
                onChange: setControl('trackpad')
              }
            }}
          />
        </div>
      </div>
    </NavigationLayout>
  )
}

RemoteControl.Title = 'Remote Control (in progress)'
RemoteControl.Tags = 'webrtc'
RemoteControl.getLayout = ({ Component, title, description, slug }) => {
  return (
    <>
      <Component layoutProps={{ title, description, slug }} />
    </>
  )
}

export default RemoteControl
