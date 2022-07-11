import { useMemo } from 'react'

let localConnection
let sendChannel

function createConnection() {
  console.log('Creating RTCPeerConnection')
  const servers = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302'
      }
    ]
  }

  localConnection = new RTCPeerConnection(servers)

  sendChannel = localConnection.createDataChannel('data-channel', {
    ordered: true
  })

  return {
    connection: localConnection,
    channel: sendChannel,
    initOffer: async () => {
      try {
        const localOffer = await localConnection.createOffer()
        localConnection.setLocalDescription(localOffer)

        return localOffer
      } catch (e) {
        console.error('Failed to create session description: ', e)
      }
    },
    answerOffer: async (desc) => {
      localConnection.setRemoteDescription(desc)
      const localAnswer = await localConnection.createAnswer()
      localConnection.setLocalDescription(localAnswer)

      return localAnswer
    },
    acceptOffer: (desc) => {
      localConnection.setRemoteDescription(desc)
    },
    addIceCandidate: (iceCandidate) => {
      const finalIceCandidate =
        typeof iceCandidate === 'string'
          ? JSON.parse(iceCandidate)
          : iceCandidate

      localConnection.addIceCandidate(finalIceCandidate)
    },
    addDataChannel: (e) => {
      sendChannel = e.channel
    },
    send: (data) => {
      const dataString = JSON.stringify(data)

      console.log('Channel state: ', sendChannel.readyState)

      if (sendChannel.readyState === 'open') {
        console.log({ dataString })

        sendChannel.send(dataString)
      }
    },
    destroy: () => {
      localConnection.close()
    }
  }
}

export const useWebRTC = () => {
  const localConnection = useMemo(() => createConnection(), [])

  return localConnection
}
