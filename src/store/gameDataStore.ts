import { create } from 'zustand'
import { Game, Location, Quest, NPC, Item, Portal, DialogueSequence } from '@/core/models/types'
import { loadGameData, saveGameData } from '@/shared/utils/api'

interface GameDataState {
	gameData: Game
	loading: boolean
	saving: boolean
	loadData: () => Promise<void>
	saveData: (dataToSave?: Game) => Promise<void>
	updateGameData: (updates: Partial<Game>) => void
	setGameData: (data: Game) => void
}

const initialGameData: Game = {
	locations: [],
	quests: [],
	npcs: [],
	items: [],
	portals: [],
	dialogues: [],
	currentLocationId: '',
	activeQuests: [],
	inventory: [],
}

export const useGameDataStore = create<GameDataState>((set: any, get: any) => ({
	gameData: initialGameData,
	loading: false,
	saving: false,

	loadData: async () => {
		set({ loading: true })
		try {
			const response = await loadGameData()
			if (response.success && response.data) {
				set({ gameData: response.data, loading: false })
			} else {
				console.error('Load failed:', response.error)
				set({ loading: false })
			}
		} catch (error) {
			console.error('Error loading data:', error)
			set({ loading: false })
		}
	},

	saveData: async (dataToSave?: Game) => {
		const data = dataToSave || get().gameData
		set({ saving: true })
		try {
			const response = await saveGameData(data)
			if (response.success) {
				if (response.data) {
					set({ gameData: response.data, saving: false })
				} else {
					set({ saving: false })
				}
			} else {
				throw new Error(response.error || 'Unknown error')
			}
		} catch (error) {
			console.error('Error saving data:', error)
			set({ saving: false })
			throw error
		}
	},

	updateGameData: (updates: Partial<Game>) => {
		set((state: any) => ({
			gameData: { ...state.gameData, ...updates },
		}))
	},

	setGameData: (data: Game) => {
		set({ gameData: data })
	},
}))

