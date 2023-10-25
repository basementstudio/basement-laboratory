import { Suspense } from 'react'
import { suspend } from 'suspend-react'

import { HTMLLayout } from '~/components/layout/html-layout'

class AudioSource {
  public audioSource: AudioBufferSourceNode | undefined
  private audioContext: AudioContext
  private buffer: AudioBuffer
  public outputNode: GainNode
  public isPlaying: boolean
  private startedAt = 0
  private pausedAt = 0
  public loop = false

  constructor(audioPlayer: WebAudioPlayer, buffer: AudioBuffer) {
    this.audioContext = audioPlayer.audioContext
    this.outputNode = this.audioContext.createGain()
    this.outputNode.connect(audioPlayer.masterOutput)
    this.buffer = buffer
    this.isPlaying = false
  }

  play() {
    if (this.isPlaying) return

    this.audioSource = this.audioContext.createBufferSource()
    this.audioSource.buffer = this.buffer
    this.audioSource.loop = this.loop
    this.audioSource.connect(this.outputNode)

    const offset = this.pausedAt % this.buffer.duration

    this.audioSource.start(0, offset)

    this.startedAt = this.audioContext.currentTime - offset
    this.pausedAt = 0
    this.isPlaying = true
  }

  pause() {
    /* Store it before this.stop flushes the startedAt */
    const elapsed = this.audioContext.currentTime - this.startedAt
    this.stop()
    this.pausedAt = elapsed
  }

  stop() {
    if (this.audioSource) {
      this.audioSource.disconnect()
      this.audioSource.stop(0)
      this.audioSource = undefined
    }

    this.pausedAt = 0
    this.startedAt = 0
    this.isPlaying = false
  }

  setVolume(volume: number) {
    this.outputNode.gain.value = volume
  }
}

class WebAudioPlayer {
  public audioContext: AudioContext
  public masterOutput: GainNode
  public isPlaying: boolean

  constructor() {
    // @ts-ignore
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.masterOutput = this.audioContext.createGain()
    this.audioContext.createBufferSource
    this.masterOutput.gain.value = 1
    this.masterOutput.connect(this.audioContext.destination)
    this.isPlaying = true
  }

  loadAudioFromURL(url: string): Promise<AudioSource> {
    return fetch(url)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => {
        return this.audioContext.decodeAudioData(arrayBuffer)
      })
      .then((buffer) => {
        return new AudioSource(this, buffer)
      })
      .catch((error) => {
        console.error('Error loading audio from URL:', error)
        throw error
      })
  }

  setVolume(volume: number) {
    this.masterOutput.gain.value = volume
  }

  pause() {
    if (!this.isPlaying) return
    this.audioContext.suspend()

    this.isPlaying = false
  }

  resume() {
    if (this.isPlaying) return
    this.audioContext.resume()

    this.isPlaying = true
  }
}

const player = new WebAudioPlayer()

const SFX = ({ src, name }: { src: string; name: string }) => {
  const source = suspend<[string], () => Promise<AudioSource>>(
    () =>
      player.loadAudioFromURL(src).then((s) => {
        s.loop = true
        return s
      }),
    [name]
  )

  return (
    <div
      style={{
        display: 'flex',
        gap: '0 1rem'
      }}
    >
      SOUND: {name}
      <button
        onClick={() => {
          source.isPlaying ? source.pause() : source.play()
        }}
      >
        play/pause
      </button>
      <button
        onClick={() => {
          source.stop()
        }}
      >
        stop
      </button>
      <span style={{ display: 'inline-block' }}>
        volume:
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue="1"
          onChange={(e) => {
            console.log('setting source volume', e.target.value)
            source.setVolume(Number(e.target.value))
          }}
        />
      </span>
    </div>
  )
}

const AudioControls = () => {
  return (
    <div style={{ display: 'flex', gap: '0 1rem' }}>
      {/* volume slider input */}
      master
      <button
        onClick={() => {
          player.isPlaying ? player.pause() : player.resume()
        }}
      >
        play/pause
      </button>
      <span>
        volume:
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue="1"
          onChange={(e) => {
            console.log('setting player volume', e.target.value)
            player.setVolume(Number(e.target.value))
          }}
        />
      </span>
    </div>
  )
}

const GameAudio = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        position: 'fixed',
        left: 0,
        top: 0
      }}
    >
      <Suspense fallback={<>loading...</>}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <AudioControls />
          <SFX name="1" src="/audio/chronicles-the-fall.mp3" />
          <SFX name="2" src="/audio/chronicles-the-fall.mp3" />
          <SFX name="3" src="/audio/chronicles-the-fall.mp3" />
          <SFX name="4" src="/audio/chronicles-the-fall.mp3" />
        </div>
      </Suspense>
    </div>
  )
}

GameAudio.Layout = HTMLLayout
GameAudio.Title = 'Game Audio'
GameAudio.Description = `
  Game audio system designed to be used with the Web Audio API.

  - Ambient sounds
  - Music
  - Sound effects
`

export default GameAudio
