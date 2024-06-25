import { create } from 'zustand'

export class AudioSource {
  public audioSource: AudioBufferSourceNode | undefined
  private audioContext: AudioContext
  private audioPlayer: WebAudioPlayer
  private buffer: AudioBuffer
  public outputNode: GainNode
  public isPlaying: boolean
  private startedAt = 0
  private pausedAt = 0
  public loop = false

  constructor(audioPlayer: WebAudioPlayer, buffer: AudioBuffer) {
    this.audioPlayer = audioPlayer
    this.audioContext = audioPlayer.audioContext
    this.outputNode = this.audioContext.createGain()
    this.outputNode.connect(audioPlayer.masterOutput)
    this.buffer = buffer
    this.isPlaying = false
  }

  resume() {
    if (this.isPlaying) return

    this.play()
  }

  play() {
    if (this.audioPlayer.isMuted) return
    this.audioSource = this.audioContext.createBufferSource()
    this.audioSource.buffer = this.buffer
    this.audioSource.loop = this.loop
    this.audioSource.connect(this.outputNode)

    const offset = this.pausedAt % this.buffer.duration

    this.audioSource.start(0, offset, this.buffer.duration - offset)

    this.startedAt = this.audioContext.currentTime - offset
    this.pausedAt = 0
    this.isPlaying = true

    this.audioSource.onended = () => {
      this.isPlaying = false
    }
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

export class WebAudioPlayer {
  public audioContext: AudioContext
  public masterOutput: GainNode
  public isPlaying: boolean
  // TODO: set this to true and add a control on the UI
  public isMuted = false

  constructor() {
    // @ts-ignore
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.masterOutput = this.audioContext.createGain()
    this.audioContext.createBufferSource
    this.masterOutput.gain.value = 1
    this.masterOutput.connect(this.audioContext.destination)
    this.isPlaying = true
  }

  unlockAudioContext() {
    const unlock = () => {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          document.removeEventListener('click', unlock)
        })
      }
    }
    document.addEventListener('click', unlock)
  }

  loadAudioFromURL(url: string): Promise<AudioSource> {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          return this.audioContext.decodeAudioData(
            arrayBuffer,
            (buffer) => {
              resolve(new AudioSource(this, buffer))
            },
            (error) => {
              console.error('Error loading audio from URL:', error)
              reject(error)
            }
          )
        })
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

export interface AudioStore {
  player?: WebAudioPlayer
  isMuted: boolean
  setMuted: (isMuted: boolean) => void
}

export const useAudio = create<AudioStore>((set, get) => {
  const player =
    typeof window !== 'undefined' ? new WebAudioPlayer() : undefined

  player?.unlockAudioContext()

  return {
    player,
    isMuted: true,
    setMuted: (isMuted) => {
      const player = get().player
      if (!player) return
      set({ isMuted })
      player.isMuted = isMuted
    }
  }
})
