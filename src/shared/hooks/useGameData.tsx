import { useState, useRef } from 'react'
import {
	Location,
	Quest,
	NPC,
	Item,
	Portal,
	Game,
	DialogueSequence,
} from '@/core/models/types'
import { loadGameData, saveGameData, generateId } from '@/shared/utils/api'

export interface GameDataHook {
	gameData: Game
	loading: boolean
	saving: boolean
	loadData: () => Promise<void>
	saveData: (dataToSave?: Game) => Promise<void>
	updateGameData: (updates: Partial<Game>) => void
}

export const useGameData = (): GameDataHook => {
	const [gameData, setGameData] = useState<Game>({
		locations: [],
		quests: [],
		npcs: [],
		items: [],
		portals: [],
		dialogues: [],
		currentLocationId: '',
		activeQuests: [],
		inventory: [],
	})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const currentSaveRef = useRef<Promise<void> | null>(null)

	const loadData = async () => {
		console.log('loadData called')
		setLoading(true)
		try {
			console.log('Calling loadGameData...')
			const response = await loadGameData()
			console.log('loadGameData response:', response)
			if (response.success && response.data) {
				console.log('Setting game data')
				setGameData(response.data)
			} else {
				console.error('Load failed:', response.error)
			}
		} catch (error) {
			console.error('Error loading data:', error)
			// Set loading to false even on error so the UI doesn't get stuck
			setLoading(false)
			throw error
		}
		console.log('Setting loading to false')
		setLoading(false)
	}

	const saveData = async (dataToSave?: Game) => {
		const data = dataToSave || gameData

		// If there's already a save in progress, wait for it
		if (currentSaveRef.current) {
			await currentSaveRef.current
		}

		// Create a new save operation
		const saveOperation = (async () => {
			try {
				setSaving(true)
				const response = await saveGameData(data)
				if (response.success) {
					// Use the updated data returned from save endpoint instead of reloading
					if (response.data) {
						setGameData(response.data)
					}
				} else {
					throw new Error(response.error || 'Unknown error')
				}
			} finally {
				setSaving(false)
				currentSaveRef.current = null
			}
		})()

		currentSaveRef.current = saveOperation
		return saveOperation
	}

	const updateGameData = (updates: Partial<Game>) => {
		setGameData((prev) => ({ ...prev, ...updates }))
	}

	return {
		gameData,
		loading,
		saving,
		loadData,
		saveData,
		updateGameData,
	}
}
