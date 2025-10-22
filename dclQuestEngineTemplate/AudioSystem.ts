import { Entity, AudioSource, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

export interface IAudioSystem {
  playBackgroundMusic(audioPath: string, volume?: number, loop?: boolean): void
  playSoundEffect(audioPath: string, volume?: number): void
  stopBackgroundMusic(): void
  setVolume(volume: number): void
  mute(): void
  unmute(): void
}

export class AudioSystem implements IAudioSystem {
  private currentAudioEntity?: Entity
  private audioVolume: number = 0.5
  private isMuted: boolean = false

  constructor() {
    // Create a persistent audio entity for background music
    this.currentAudioEntity = engine.addEntity()
    Transform.create(this.currentAudioEntity, {
      position: Vector3.Zero()
    })
  }

  /**
   * Play background music for a scene
   */
  playBackgroundMusic(audioPath: string, volume: number = 0.5, loop: boolean = true): void {
    if (!this.currentAudioEntity) return

    // Stop current audio if playing
    this.stopBackgroundMusic()

    // Create new audio source
    AudioSource.createOrReplace(this.currentAudioEntity, {
      audioClipUrl: audioPath,
      loop: loop,
      volume: this.isMuted ? 0 : volume,
      playing: true,
      global: true
    })

    this.audioVolume = volume

    console.log(`🎵 Playing background music: ${audioPath}`)
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic(): void {
    if (!this.currentAudioEntity) return

    const audioSource = AudioSource.getMutableOrNull(this.currentAudioEntity)
    if (audioSource) {
      audioSource.playing = false
    }
  }

  /**
   * Set volume for background music
   */
  setVolume(volume: number): void {
    this.audioVolume = Math.max(0, Math.min(1, volume))

    if (!this.currentAudioEntity) return

    const audioSource = AudioSource.getMutableOrNull(this.currentAudioEntity)
    if (audioSource) {
      audioSource.volume = this.isMuted ? 0 : this.audioVolume
    }
  }

  /**
   * Mute all audio
   */
  mute(): void {
    this.isMuted = true

    if (!this.currentAudioEntity) return

    const audioSource = AudioSource.getMutableOrNull(this.currentAudioEntity)
    if (audioSource) {
      audioSource.volume = 0
    }
  }

  /**
   * Unmute audio (restore previous volume)
   */
  unmute(): void {
    this.isMuted = false

    if (!this.currentAudioEntity) return

    const audioSource = AudioSource.getMutableOrNull(this.currentAudioEntity)
    if (audioSource) {
      audioSource.volume = this.audioVolume
    }
  }

  /**
   * Play a one-shot sound effect
   */
  playSoundEffect(audioPath: string, volume: number = 1.0, position?: Vector3): void {
    const soundEntity = engine.addEntity()

    Transform.create(soundEntity, {
      position: position || Vector3.Zero()
    })

    AudioSource.create(soundEntity, {
      audioClipUrl: audioPath,
      loop: false,
      volume: volume,
      playing: true
    })

    console.log(`🔊 Playing sound effect: ${audioPath}`)
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.audioVolume
  }

  /**
   * Check if muted
   */
  isAudioMuted(): boolean {
    return this.isMuted
  }

  /**
   * Cleanup audio system
   */
  cleanup(): void {
    this.stopBackgroundMusic()
    if (this.currentAudioEntity) {
      engine.removeEntity(this.currentAudioEntity)
      this.currentAudioEntity = undefined
    }
  }
}
