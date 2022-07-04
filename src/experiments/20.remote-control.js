import { createClient } from '@liveblocks/client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMobileOrientation } from 'react-device-detect'

import { NavigationLayout } from '../components/layout/navigation-layout'
import { safeWindow } from '../lib/constants'

const hasControl = () => {
  const url = new URL(safeWindow.location.href)
  return url.searchParams.get('control')
}

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_API_KEY
})

const Button = ({ active, ...rest }) => {
  return (
    <button
      style={{
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
        gridTemplateColumns: 'repeat(2, 1fr)'
      }}
    >
      <Button
        active={controls?.a?.value}
        onTouchStart={() => controls?.a?.onChange(true)}
        onTouchEnd={() => controls?.a?.onChange(false)}
      >
        A
      </Button>
      <Button
        active={controls?.b?.value}
        onTouchStart={() => controls?.b?.onChange(true)}
        onTouchEnd={() => controls?.b?.onChange(false)}
      >
        B
      </Button>
    </div>
  )
}

const PART_TYPE = hasControl() ? 'control' : 'receiver'
const IS_CONTROL = PART_TYPE === 'control'
const IS_RECEIVER = PART_TYPE === 'receiver'

const RemoteControl = ({ layoutProps }) => {
  const { isLandscape } = useMobileOrientation()
  const [controls, setControls] = useState({ a: false, b: false })
  const [controller, setController] = useState(null)
  const room = useRef(null)

  const setControl = useCallback(
    (targetControl) => (value) => {
      setControls((controls) => {
        return { ...controls, [targetControl]: value }
      })
    },
    [setControls]
  )

  useEffect(() => {
    if (IS_CONTROL && room.current) {
      const _room = room.current

      _room.broadcastEvent({ type: 'update-controls', controls })
    }
  }, [controls])

  useEffect(() => {
    const ROOM_ID = 'remote-control'
    let _room

    try {
      _room = client.enter(ROOM_ID, {
        initialPresence: { type: PART_TYPE }
      })

      if (IS_RECEIVER) {
        _room.subscribe('others', (others, event) => {
          const isSelf = () => event.user.id === _room.getSelf().id

          if (event.type === 'enter') {
            if (isSelf()) {
              setController(event.user)
            }
          }

          if (event.type === 'leave') {
            if (isSelf()) {
              if (others.count === 0) {
                setController(null)
              }
            }
          }
        })

        _room.subscribe('event', (event) => {
          console.log('New event', event)

          if (event.event.type === 'update-controls') {
            console.log('Update controls!', event.controls)
            setControls(event.event.controls)
          }
        })
      }

      console.log('Room connection successful: ', _room)
      room.current = _room
    } catch (error) {
      console.log('Error connecting to room: ', error)
    }

    return () => {
      client.leave(ROOM_ID)
    }
  }, [])

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
              b: { value: controls.b, onChange: setControl('b') }
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
        <div>
          {process.env.NEXT_PUBLIC_SITE_URL}
          /experiments/20.remote-control.js?control="
          {'remote-control'}"
        </div>
        <br />
        <div>{controller ? 'Has control' : 'Has no control'}</div>
        <br />
        <div style={{ width: '100%', height: 400, maxWidth: 700 }}>
          <ControlView
            controls={{ a: { value: controls.a }, b: { value: controls.b } }}
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
