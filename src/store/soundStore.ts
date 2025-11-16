import { create } from 'zustand'

interface SoundState {
	enabled: boolean
	volume: number
	setEnabled: (enabled: boolean) => void
	setVolume: (volume: number) => void
}

export const useSoundStore = create<SoundState>((set: any) => ({
	enabled: true,
	volume: 0.5,
	setEnabled: (enabled: boolean) => set({ enabled }),
	setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(1, volume)) }),
}))

