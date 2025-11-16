import { useSoundStore } from '@/store/soundStore'

type SoundType =
	| 'click'
	| 'modalOpen'
	| 'modalClose'
	| 'dragStart'
	| 'dragEnd'
	| 'drop'
	| 'success'
	| 'error'
	| 'notification'

interface SoundConfig {
	frequency: number
	duration: number
}

class SoundManager {
	private soundConfigs: Map<SoundType, SoundConfig> = new Map()
	private initialized = false

	init() {
		if (this.initialized) return

		// Define sound configurations
		this.soundConfigs.set('click', { frequency: 800, duration: 0.1 })
		this.soundConfigs.set('modalOpen', { frequency: 600, duration: 0.15 })
		this.soundConfigs.set('modalClose', { frequency: 400, duration: 0.15 })
		this.soundConfigs.set('dragStart', { frequency: 300, duration: 0.1 })
		this.soundConfigs.set('dragEnd', { frequency: 400, duration: 0.1 })
		this.soundConfigs.set('drop', { frequency: 500, duration: 0.2 })
		this.soundConfigs.set('success', { frequency: 800, duration: 0.3 })
		this.soundConfigs.set('error', { frequency: 200, duration: 0.3 })
		this.soundConfigs.set('notification', { frequency: 600, duration: 0.2 })

		this.initialized = true
	}

	play(type: SoundType) {
		if (!this.initialized) {
			this.init()
		}

		const { enabled, volume } = useSoundStore.getState()
		if (!enabled) return

		const config = this.soundConfigs.get(type)
		if (!config) return

		this.playTone(config.frequency, config.duration, volume)
	}

	private playTone(frequency: number, duration: number, volume: number) {
		try {
			const audioContext = new (window.AudioContext ||
				(window as any).webkitAudioContext)()
			const oscillator = audioContext.createOscillator()
			const gainNode = audioContext.createGain()

			oscillator.connect(gainNode)
			gainNode.connect(audioContext.destination)

			oscillator.frequency.value = frequency
			oscillator.type = 'sine'

			gainNode.gain.setValueAtTime(0, audioContext.currentTime)
			gainNode.gain.linearRampToValueAtTime(volume * 0.3, audioContext.currentTime + 0.01)
			gainNode.gain.exponentialRampToValueAtTime(
				0.01,
				audioContext.currentTime + duration
			)

			oscillator.start(audioContext.currentTime)
			oscillator.stop(audioContext.currentTime + duration)
		} catch (error) {
			console.warn('Audio playback failed:', error)
		}
	}

	setVolume(volume: number) {
		// Volume is handled per-play in the playTone method
		// No-op here since we don't store Howl instances
	}

	mute() {
		// Muting is handled by checking enabled state in play method
		// No-op here since we don't store Howl instances
	}

	unmute() {
		// Unmuting is handled by checking enabled state in play method
		// No-op here since we don't store Howl instances
	}
}

export const soundManager = new SoundManager()

// Initialize on import
soundManager.init()

