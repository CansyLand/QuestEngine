import { useSoundStore } from '@/store/soundStore'
import { soundManager } from '@/core/services/SoundManager'

export const useSound = () => {
	return {
		play: (type: Parameters<typeof soundManager.play>[0]) => {
			soundManager.play(type)
		},
	}
}

