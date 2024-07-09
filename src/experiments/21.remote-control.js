import { createClient } from '@liveblocks/client'
import { OrbitControls, Plane, Sphere } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody, useRapier } from '@react-three/rapier'
import { useQRCode } from 'next-qrcode'
import { useCallback, useEffect, useState } from 'react'
import { useMobileOrientation } from 'react-device-detect'
import useMeasure from 'react-use-measure'
import * as THREE from 'three'

import { CoolGrid } from '~/components/common/cool-grid'

import { NavigationLayout } from '../components/layout/navigation-layout'
import { useWebRTC } from '../hooks/use-web-rtc'
import { isClient, safeWindow } from '../lib/constants'

/* Create singleton controller */
class Controller {
  constructor() {
    this.x = 0
    this.y = 0
  }

  get() {
    return [this.x, this.y]
  }

  set(x, y) {
    this.x = THREE.MathUtils.clamp(x, -1, 1)
    this.y = THREE.MathUtils.clamp(y, -1, 1)
  }
}

const ControllerInstance = new Controller()

const hasControl = () => {
  if (!isClient) return

  const url = new URL(safeWindow.location.href)
  return url.searchParams.get('control')
}

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_API_KEY
})

const TrackPad = ({ onChange, coords }) => {
  const [ref, bounds] = useMeasure()

  const handleUpdate = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Get relative coords
    const x = e.touches[0].clientX - bounds.left
    const y = e.touches[0].clientY - bounds.top

    /* Normalize these in a range from -1 to 1 */

    const xNormalized = (x / bounds.width) * 2 - 1
    const yNormalized = (y / bounds.height) * 2 - 1

    onChange([
      THREE.MathUtils.clamp(xNormalized, -1, 1),
      THREE.MathUtils.clamp(yNormalized, -1, 1)
    ])
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
      ref={ref}
    >
      <span
        style={{
          position: 'absolute',
          left: (coords[0] * bounds.width + bounds.width) / 2,
          top: (coords[1] * bounds.height + bounds.height) / 2,
          display: 'inline-block',
          borderRadius: '50%',
          width: 50,
          height: 50,
          border: '1px solid white',
          transform: 'translate(-50%, -50%)',
          background: 'black'
        }}
      />
      <span className="inline-block p-2">
        [{coords[0]},{coords[1]}]
      </span>
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

  useEffect(() => {
    console.log(
      'Setting controls',
      controls.trackpad?.[0],
      controls.trackpad?.[1]
    )
    ControllerInstance.set(
      controls.trackpad?.[0] ?? 0,
      controls.trackpad?.[1] ?? 0
    )
  }, [controls.trackpad?.[0], controls.trackpad?.[1]])

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
  ) : controller ? (
    <>
      <NavigationLayout {...layoutProps}>
        <Minigame />

        <div
          style={{
            height: 250,
            width: 500,
            position: 'fixed',
            right: 16,
            bottom: 16,
            background: 'black'
          }}
        >
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
      </NavigationLayout>
    </>
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

const World = () => {
  const { world } = useRapier()

  useFrame(() => {
    const [x, y] = ControllerInstance.get()
    console.log('Controller:', x, y)
    world.gravity.x = x * 10
    world.gravity.z = y * 10
  })

  return (
    <>
      <ambientLight />
      <OrbitControls />
      <CoolGrid />

      <RigidBody
        shape="ball"
        colliders="ball"
        position={[0, 5, 0]}
        type="dynamic"
      >
        <Sphere />
      </RigidBody>
      <RigidBody rotation={[-Math.PI / 2, 0, 0]} type="fixed" includeInvisible>
        <Plane args={[46, 46]} visible={false} />
      </RigidBody>
    </>
  )
}

const Minigame = () => {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Canvas
        camera={{
          position: [0, 4, 6],
          near: 0.1
        }}
      >
        <Physics debug>
          <World />
        </Physics>
      </Canvas>
    </div>
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
