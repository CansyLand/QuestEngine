import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
	Quest,
	DialogueSequence,
	NPC,
	Game,
	Dialog,
	Button,
	QuestStep,
} from '@/core/models/types'
import { Card } from '@/shared/ui'
import { ImageDisplay } from '@/shared/components/ui/ImagePicker'
import { generateIdFromApi } from '@/shared/utils/api'
import { QuestStepEditModal } from '../modals/QuestStepEditModal'
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'

interface QuestPanel2Props {
	quests: Quest[]
	npcs: NPC[]
	dialogues: DialogueSequence[]
	gameData: Game
	onSetGameData?: (data: Game) => void
	onSaveData?: (data?: Game) => Promise<void>
}

export const QuestPanel2: React.FC<QuestPanel2Props> = ({
	quests,
	npcs,
	dialogues,
	gameData,
	onSetGameData,
	onSaveData,
}) => {
	const [projectPath, setProjectPath] = useState<string | null>(null)

	// State for tracking edited dialogue text
	const [editedDialogues, setEditedDialogues] = useState<
		Record<string, string>
	>({})
	const [originalDialogues, setOriginalDialogues] = useState<
		Record<string, string>
	>({})

	// State for new dialogue sequences being created (keyed by questStepId)
	const [newDialogues, setNewDialogues] = useState<
		Record<string, Partial<DialogueSequence>>
	>({})

	// State for editing existing dialogues (keyed by dialogueId)
	const [editingDialogues, setEditingDialogues] = useState<
		Record<string, DialogueSequence>
	>({})

	// State for expanded/collapsed dialogue editing UI (keyed by dialogueId or questStepId)
	const [expandedDialogues, setExpandedDialogues] = useState<
		Record<string, boolean>
	>({})

	// State for hovered dialogue sequences (to show add/remove buttons)
	const [hoveredDialogueId, setHoveredDialogueId] = useState<string | null>(
		null
	)

	// State for QuestStepEditModal
	const [stepModalOpen, setStepModalOpen] = useState<boolean>(false)
	const [editingStep, setEditingStep] = useState<QuestStep | null>(null)
	const [editingQuestId, setEditingQuestId] = useState<string | null>(null)
	const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)

	// Confirmation dialog hook
	const confirmDialog = useConfirmDialog()

	// Refs to track latest state for auto-save (to avoid stale closures)
	const editedDialoguesRef = useRef(editedDialogues)
	const editingDialoguesRef = useRef(editingDialogues)
	const newDialoguesRef = useRef(newDialogues)
	const dialoguesRef = useRef(dialogues)
	const gameDataRef = useRef(gameData)

	// Keep refs in sync with state and props
	useEffect(() => {
		editedDialoguesRef.current = editedDialogues
	}, [editedDialogues])
	useEffect(() => {
		editingDialoguesRef.current = editingDialogues
	}, [editingDialogues])
	useEffect(() => {
		newDialoguesRef.current = newDialogues
	}, [newDialogues])
	useEffect(() => {
		dialoguesRef.current = dialogues
		// When dialogues prop changes, clear editedDialogues for dialogs that no longer exist or have matching text
		setEditedDialogues((prev) => {
			const updated: Record<string, string> = {}
			for (const dialogue of dialogues) {
				for (const dialog of dialogue.dialogs) {
					if (prev[dialog.id] !== undefined) {
						// Only keep edited text if it's different from the current text
						if (prev[dialog.id] !== dialog.text) {
							updated[dialog.id] = prev[dialog.id]
						}
					}
				}
			}
			editedDialoguesRef.current = updated
			return updated
		})
	}, [dialogues])
	useEffect(() => {
		gameDataRef.current = gameData
	}, [gameData])

	// Ref to track timeout for debouncing
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		const getProjectPath = async () => {
			const electronAPI = (window as any).electronAPI
			const path = electronAPI
				? await electronAPI.getQuestEditorProjectPath()
				: null
			setProjectPath(path)
		}
		getProjectPath()

		// Cleanup timeout on unmount
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current)
			}
		}
	}, [])

	// Auto-save function with debouncing - uses refs to always get latest state
	const autoSave = useCallback(async () => {
		if (!onSetGameData || !onSaveData) {
			console.log('QuestPanel2: Auto-save skipped - missing handlers')
			return
		}

		try {
			// Use refs to get latest state values
			const currentEditedDialogues = editedDialoguesRef.current
			const currentEditingDialogues = editingDialoguesRef.current
			const currentNewDialogues = newDialoguesRef.current
			const currentDialogues = dialoguesRef.current
			const currentGameData = gameDataRef.current

			console.log(
				'QuestPanel2: Starting auto-save with edited dialogues:',
				Object.keys(currentEditedDialogues)
			)

			// Start with existing dialogues
			let updatedDialogues = [...currentDialogues]

			// Update all dialogues that have edited dialogs (text-only)
			updatedDialogues = updatedDialogues.map((dialogue) => {
				const hasEditedDialogs = dialogue.dialogs.some(
					(dialog) => currentEditedDialogues[dialog.id] !== undefined
				)

				if (hasEditedDialogs) {
					console.log(`QuestPanel2: Updating dialogue ${dialogue.id}`)
					// Update this dialogue sequence with edited dialog texts
					const updatedDialogs = dialogue.dialogs.map((dialog) =>
						currentEditedDialogues[dialog.id] !== undefined
							? { ...dialog, text: currentEditedDialogues[dialog.id] }
							: dialog
					)

					return { ...dialogue, dialogs: updatedDialogs }
				}

				return dialogue
			})

			// Update dialogues that are being edited inline
			updatedDialogues = updatedDialogues.map((dialogue) => {
				if (currentEditingDialogues[dialogue.id]) {
					return currentEditingDialogues[dialogue.id]
				}
				return dialogue
			})

			// Add new dialogue sequences that are complete (have name, npcId, and at least one dialog)
			Object.entries(currentNewDialogues).forEach(
				([questStepId, newDialogue]) => {
					if (
						newDialogue.name &&
						newDialogue.npcId &&
						newDialogue.dialogs &&
						newDialogue.dialogs.length > 0 &&
						newDialogue.id
					) {
						// Check if this dialogue already exists
						const exists = updatedDialogues.some((d) => d.id === newDialogue.id)
						if (!exists) {
							updatedDialogues.push({
								id: newDialogue.id!,
								name: newDialogue.name!,
								npcId: newDialogue.npcId,
								questStepId: questStepId,
								dialogs: newDialogue.dialogs as Dialog[],
							})
						}
					}
				}
			)

			// Create the updated game data
			const updatedGameData: Game = {
				...currentGameData,
				dialogues: updatedDialogues,
			}

			// Update local state and save
			onSetGameData(updatedGameData)
			console.log('QuestPanel2: Updated local game data, calling onSaveData')
			await onSaveData(updatedGameData)
			console.log('QuestPanel2: Auto-save completed successfully')
		} catch (error) {
			console.error('QuestPanel2: Error auto-saving dialogues:', error)
		}
	}, [onSetGameData, onSaveData])

	// Handle input changes
	const handleDialogueChange = (
		dialogId: string,
		newText: string,
		originalText: string
	) => {
		// Update state using functional update to ensure we have latest state
		setEditedDialogues((prev) => {
			const updated = { ...prev, [dialogId]: newText }
			// Update ref immediately for synchronous access
			editedDialoguesRef.current = updated
			return updated
		})

		// Store original text if not already stored
		setOriginalDialogues((prev) => {
			if (!prev[dialogId]) {
				return { ...prev, [dialogId]: originalText }
			}
			return prev
		})

		// Clear existing timeout
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current)
		}

		// Set new timeout for auto-save
		saveTimeoutRef.current = setTimeout(() => {
			autoSave()
			saveTimeoutRef.current = null
		}, 500)
	}

	// Handle revert to original
	const handleRevertDialogue = (dialogId: string) => {
		const originalText = originalDialogues[dialogId]
		if (originalText) {
			setEditedDialogues((prev) => {
				const newState = { ...prev }
				delete newState[dialogId]
				return newState
			})

			// Auto-save the revert
			setTimeout(() => autoSave(), 100)
		}
	}

	// Generate unique dialog ID
	const generateDialogId = (): string => {
		return `dialog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	// Start creating a new dialogue sequence for a quest step
	const handleStartNewDialogue = (questStepId: string) => {
		const newDialogue: Partial<DialogueSequence> = {
			id: `temp_${Date.now()}`,
			name: '',
			npcId: undefined,
			questStepId: questStepId,
			dialogs: [],
		}
		setNewDialogues((prev) => ({ ...prev, [questStepId]: newDialogue }))
		setExpandedDialogues((prev) => ({ ...prev, [questStepId]: true }))
	}

	// Update new dialogue sequence
	const handleUpdateNewDialogue = (
		questStepId: string,
		updates: Partial<DialogueSequence>
	) => {
		setNewDialogues((prev) => {
			const current = prev[questStepId] || {}
			const updated = { ...current, ...updates }

			// Auto-generate ID when name or npcId changes
			const nameChanged = updates.name && updates.name !== current.name
			const npcIdChanged =
				updates.npcId !== undefined && updates.npcId !== current.npcId

			if (nameChanged || (npcIdChanged && updated.name)) {
				generateIdFromApi(
					updated.name || 'dialogue',
					'dialogue',
					current.id,
					updated.npcId
				)
					.then((response) => {
						if (response.success && response.data?.id) {
							setNewDialogues((prevState) => ({
								...prevState,
								[questStepId]: { ...updated, id: response.data.id },
							}))
						}
					})
					.catch((error) => {
						console.error('Failed to generate dialogue ID:', error)
					})
			}

			return { ...prev, [questStepId]: updated }
		})

		setTimeout(() => autoSave(), 500)
	}

	// Add dialog to new dialogue sequence
	const handleAddDialogToNew = (questStepId: string) => {
		const newDialog: Dialog = {
			id: generateDialogId(),
			text: '',
			isQuestion: false,
			isEndOfDialog: false, // This will be corrected by correctDialogTypes
		}

		setNewDialogues((prev) => {
			const current = prev[questStepId] || { dialogs: [] }
			const updatedDialogs = correctDialogTypes([
				...(current.dialogs || []),
				newDialog,
			])
			return {
				...prev,
				[questStepId]: {
					...current,
					dialogs: updatedDialogs,
				},
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Update dialog in new dialogue sequence
	const handleUpdateDialogInNew = (
		questStepId: string,
		dialogIndex: number,
		updates: Partial<Dialog>
	) => {
		setNewDialogues((prev) => {
			const current = prev[questStepId]
			if (!current || !current.dialogs) return prev

			const updatedDialogs = [...current.dialogs]
			updatedDialogs[dialogIndex] = {
				...updatedDialogs[dialogIndex],
				...updates,
			}

			return {
				...prev,
				[questStepId]: {
					...current,
					dialogs: updatedDialogs,
				},
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Remove dialog from new dialogue sequence
	const handleRemoveDialogFromNew = (
		questStepId: string,
		dialogIndex: number
	) => {
		setNewDialogues((prev) => {
			const current = prev[questStepId]
			if (!current || !current.dialogs) return prev

			const filteredDialogs = current.dialogs.filter(
				(_: Dialog, i: number) => i !== dialogIndex
			)
			const updatedDialogs = correctDialogTypes(filteredDialogs)

			return {
				...prev,
				[questStepId]: {
					...current,
					dialogs: updatedDialogs,
				},
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Add button to dialog in new dialogue sequence
	const handleAddButtonToNew = (questStepId: string, dialogIndex: number) => {
		setNewDialogues((prev) => {
			const current = prev[questStepId]
			if (!current || !current.dialogs) return prev

			const dialog = current.dialogs[dialogIndex]
			const newButton: Button = {
				label: 'New Option',
				goToDialog: dialogIndex,
				size: 300,
			}

			const updatedDialogs = [...current.dialogs]
			updatedDialogs[dialogIndex] = {
				...dialog,
				buttons: [...(dialog.buttons || []), newButton],
			}

			return {
				...prev,
				[questStepId]: {
					...current,
					dialogs: updatedDialogs,
				},
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Update button in new dialogue sequence
	const handleUpdateButtonInNew = (
		questStepId: string,
		dialogIndex: number,
		buttonIndex: number,
		updates: Partial<Button>
	) => {
		setNewDialogues((prev) => {
			const current = prev[questStepId]
			if (!current || !current.dialogs) return prev

			const dialog = current.dialogs[dialogIndex]
			const updatedButtons = [...(dialog.buttons || [])]
			updatedButtons[buttonIndex] = {
				...updatedButtons[buttonIndex],
				...updates,
			}

			const updatedDialogs = [...current.dialogs]
			updatedDialogs[dialogIndex] = {
				...dialog,
				buttons: updatedButtons,
			}

			return {
				...prev,
				[questStepId]: {
					...current,
					dialogs: updatedDialogs,
				},
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Remove button from new dialogue sequence
	const handleRemoveButtonFromNew = (
		questStepId: string,
		dialogIndex: number,
		buttonIndex: number
	) => {
		setNewDialogues((prev) => {
			const current = prev[questStepId]
			if (!current || !current.dialogs) return prev

			const dialog = current.dialogs[dialogIndex]
			const updatedButtons = (dialog.buttons || []).filter(
				(_: Button, i: number) => i !== buttonIndex
			)

			const updatedDialogs = [...current.dialogs]
			updatedDialogs[dialogIndex] = {
				...dialog,
				buttons: updatedButtons,
			}

			return {
				...prev,
				[questStepId]: {
					...current,
					dialogs: updatedDialogs,
				},
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Toggle edit mode for existing dialogue
	const handleToggleEditDialogue = (dialogueId: string) => {
		if (editingDialogues[dialogueId]) {
			// Save changes before closing - trigger auto-save immediately
			autoSave().then(() => {
				// After save completes, remove from editing state
				setEditingDialogues((prev) => {
					const newState = { ...prev }
					delete newState[dialogueId]
					return newState
				})
			})
		} else {
			// Start editing - copy dialogue to editing state
			const dialogue = dialogues.find((d) => d.id === dialogueId)
			if (dialogue) {
				setEditingDialogues((prev) => ({
					...prev,
					[dialogueId]: { ...dialogue },
				}))
			}
		}
		setExpandedDialogues((prev) => ({
			...prev,
			[dialogueId]: !prev[dialogueId],
		}))
	}

	// Update existing dialogue being edited
	const handleUpdateEditingDialogue = (
		dialogueId: string,
		updates: Partial<DialogueSequence>
	) => {
		setEditingDialogues((prev) => {
			const current = prev[dialogueId]
			if (!current) return prev

			return {
				...prev,
				[dialogueId]: { ...current, ...updates },
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Add dialog to existing dialogue being edited
	const handleAddDialogToEditing = (dialogueId: string) => {
		const newDialog: Dialog = {
			id: generateDialogId(),
			text: '',
			isQuestion: false,
			isEndOfDialog: false, // This will be corrected by correctDialogTypes
		}

		setEditingDialogues((prev) => {
			const current = prev[dialogueId]
			if (!current) return prev

			const updatedDialogs = correctDialogTypes([...current.dialogs, newDialog])

			return {
				...prev,
				[dialogueId]: {
					...current,
					dialogs: updatedDialogs,
				},
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Update dialog in existing dialogue being edited
	const handleUpdateDialogInEditing = (
		dialogueId: string,
		dialogIndex: number,
		updates: Partial<Dialog>
	) => {
		setEditingDialogues((prev) => {
			const current = prev[dialogueId]
			if (!current) return prev

			const updatedDialogs = [...current.dialogs]
			updatedDialogs[dialogIndex] = {
				...updatedDialogs[dialogIndex],
				...updates,
			}

			return {
				...prev,
				[dialogueId]: {
					...current,
					dialogs: updatedDialogs,
				},
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Remove dialog from existing dialogue being edited
	const handleRemoveDialogFromEditing = (
		dialogueId: string,
		dialogIndex: number
	) => {
		setEditingDialogues((prev) => {
			const current = prev[dialogueId]
			if (!current) return prev

			const filteredDialogs = current.dialogs.filter(
				(_: Dialog, i: number) => i !== dialogIndex
			)
			const updatedDialogs = correctDialogTypes(filteredDialogs)

			return {
				...prev,
				[dialogueId]: {
					...current,
					dialogs: updatedDialogs,
				},
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Add button to dialog in existing dialogue being edited
	const handleAddButtonToEditing = (
		dialogueId: string,
		dialogIndex: number
	) => {
		setEditingDialogues((prev) => {
			const current = prev[dialogueId]
			if (!current) return prev

			const dialog = current.dialogs[dialogIndex]
			const newButton: Button = {
				label: 'New Option',
				goToDialog: dialogIndex,
				size: 300,
			}

			const updatedDialogs = [...current.dialogs]
			updatedDialogs[dialogIndex] = {
				...dialog,
				buttons: [...(dialog.buttons || []), newButton],
			}

			return {
				...prev,
				[dialogueId]: {
					...current,
					dialogs: updatedDialogs,
				},
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Update button in existing dialogue being edited
	const handleUpdateButtonInEditing = (
		dialogueId: string,
		dialogIndex: number,
		buttonIndex: number,
		updates: Partial<Button>
	) => {
		setEditingDialogues((prev) => {
			const current = prev[dialogueId]
			if (!current) return prev

			const dialog = current.dialogs[dialogIndex]
			const updatedButtons = [...(dialog.buttons || [])]
			updatedButtons[buttonIndex] = {
				...updatedButtons[buttonIndex],
				...updates,
			}

			const updatedDialogs = [...current.dialogs]
			updatedDialogs[dialogIndex] = {
				...dialog,
				buttons: updatedButtons,
			}

			return {
				...prev,
				[dialogueId]: {
					...current,
					dialogs: updatedDialogs,
				},
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Remove button from existing dialogue being edited
	const handleRemoveButtonFromEditing = (
		dialogueId: string,
		dialogIndex: number,
		buttonIndex: number
	) => {
		setEditingDialogues((prev) => {
			const current = prev[dialogueId]
			if (!current) return prev

			const dialog = current.dialogs[dialogIndex]
			const updatedButtons = (dialog.buttons || []).filter(
				(_: Button, i: number) => i !== buttonIndex
			)

			const updatedDialogs = [...current.dialogs]
			updatedDialogs[dialogIndex] = {
				...dialog,
				buttons: updatedButtons,
			}

			return {
				...prev,
				[dialogueId]: {
					...current,
					dialogs: updatedDialogs,
				},
			}
		})

		setTimeout(() => autoSave(), 500)
	}

	// Helper function to correct dialog types based on position
	const correctDialogTypes = (dialogs: Dialog[]): Dialog[] => {
		return dialogs.map((dialog, index) => ({
			...dialog,
			isEndOfDialog: index === dialogs.length - 1,
		}))
	}

	// Cancel new dialogue creation
	const handleCancelNewDialogue = (questStepId: string) => {
		setNewDialogues((prev) => {
			const newState = { ...prev }
			delete newState[questStepId]
			return newState
		})
		setExpandedDialogues((prev) => {
			const newState = { ...prev }
			delete newState[questStepId]
			return newState
		})
	}

	// Add dialog to existing dialogue (quick add without full edit mode)
	const handleQuickAddDialog = (dialogueId: string) => {
		const dialogue = dialogues.find((d) => d.id === dialogueId)
		if (!dialogue) return

		const newDialog: Dialog = {
			id: generateDialogId(),
			text: '',
			isQuestion: false,
			isEndOfDialog: false, // This will be corrected by correctDialogTypes
		}

		const updatedDialogs = correctDialogTypes([...dialogue.dialogs, newDialog])

		// If already in editing state, update it, otherwise create editing state
		if (editingDialogues[dialogueId]) {
			setEditingDialogues((prev) => ({
				...prev,
				[dialogueId]: {
					...prev[dialogueId],
					dialogs: updatedDialogs,
				},
			}))
		} else {
			setEditingDialogues((prev) => ({
				...prev,
				[dialogueId]: {
					...dialogue,
					dialogs: updatedDialogs,
				},
			}))
		}

		// Expand the dialogue to show the new dialog
		setExpandedDialogues((prev) => ({
			...prev,
			[dialogueId]: true,
		}))

		setTimeout(() => autoSave(), 500)
	}

	// Remove dialog from existing dialogue (quick remove)
	const handleQuickRemoveDialog = (dialogueId: string, dialogIndex: number) => {
		const dialogue = dialogues.find((d) => d.id === dialogueId)
		if (!dialogue) return

		const filteredDialogs = dialogue.dialogs.filter(
			(_: Dialog, i: number) => i !== dialogIndex
		)
		const updatedDialogs = correctDialogTypes(filteredDialogs)

		// If already in editing state, update it, otherwise create editing state
		if (editingDialogues[dialogueId]) {
			setEditingDialogues((prev) => ({
				...prev,
				[dialogueId]: {
					...prev[dialogueId],
					dialogs: updatedDialogs,
				},
			}))
		} else {
			setEditingDialogues((prev) => ({
				...prev,
				[dialogueId]: {
					...dialogue,
					dialogs: updatedDialogs,
				},
			}))
		}

		setTimeout(() => autoSave(), 500)
	}

	// Remove entire dialogue sequence
	const handleRemoveDialogueSequence = (dialogueId: string) => {
		// Remove from editing state if present
		setEditingDialogues((prev) => {
			const newState = { ...prev }
			delete newState[dialogueId]
			return newState
		})

		// Remove from dialogues array via auto-save
		const updatedDialogues = dialogues.filter((d) => d.id !== dialogueId)
		const updatedGameData: Game = {
			...gameData,
			dialogues: updatedDialogues,
		}

		if (onSetGameData && onSaveData) {
			onSetGameData(updatedGameData)
			onSaveData(updatedGameData).catch((error) => {
				console.error('Error removing dialogue sequence:', error)
			})
		}
	}
	// Handler functions for quest step management
	const handleAddQuestStep = (questId: string) => {
		const newStep: QuestStep = {
			id: `temp_step_${Date.now()}`,
			name: 'New Step',
			objectiveType: 'custom',
			objectiveParams: {},
			onStart: [],
			onComplete: [],
		}
		setEditingStep(newStep)
		setEditingQuestId(questId)
		setEditingStepIndex(null)
		setStepModalOpen(true)
	}

	const handleEditQuestStep = (questId: string, stepIndex: number) => {
		const quest = quests.find((q) => q.id === questId)
		if (!quest || !quest.steps[stepIndex]) return

		setEditingStep(quest.steps[stepIndex])
		setEditingQuestId(questId)
		setEditingStepIndex(stepIndex)
		setStepModalOpen(true)
	}

	const handleSaveQuestStep = (step: QuestStep) => {
		if (!editingQuestId || !onSetGameData || !onSaveData) return

		const quest = quests.find((q) => q.id === editingQuestId)
		if (!quest) return

		let updatedSteps: QuestStep[]
		if (editingStepIndex !== null) {
			// Edit existing step
			updatedSteps = [...quest.steps]
			updatedSteps[editingStepIndex] = step
		} else {
			// Add new step
			updatedSteps = [...quest.steps, step]
		}

		const updatedQuests = quests.map((q) =>
			q.id === editingQuestId ? { ...q, steps: updatedSteps } : q
		)

		const updatedGameData: Game = {
			...gameData,
			quests: updatedQuests,
		}

		onSetGameData(updatedGameData)
		onSaveData(updatedGameData).catch((error) => {
			console.error('Error saving quest step:', error)
		})

		setStepModalOpen(false)
		setEditingStep(null)
		setEditingQuestId(null)
		setEditingStepIndex(null)
	}

	const handleCancelStepEdit = () => {
		setStepModalOpen(false)
		setEditingStep(null)
		setEditingQuestId(null)
		setEditingStepIndex(null)
	}

	const handleMoveQuestStepUp = (questId: string, stepIndex: number) => {
		if (stepIndex === 0 || !onSetGameData || !onSaveData) return

		const quest = quests.find((q) => q.id === questId)
		if (!quest) return

		const updatedSteps = [...quest.steps]
		;[updatedSteps[stepIndex - 1], updatedSteps[stepIndex]] = [
			updatedSteps[stepIndex],
			updatedSteps[stepIndex - 1],
		]

		const updatedQuests = quests.map((q) =>
			q.id === questId ? { ...q, steps: updatedSteps } : q
		)

		const updatedGameData: Game = {
			...gameData,
			quests: updatedQuests,
		}

		onSetGameData(updatedGameData)
		onSaveData(updatedGameData).catch((error) => {
			console.error('Error moving quest step up:', error)
		})
	}

	const handleMoveQuestStepDown = (questId: string, stepIndex: number) => {
		const quest = quests.find((q) => q.id === questId)
		if (
			!quest ||
			stepIndex === quest.steps.length - 1 ||
			!onSetGameData ||
			!onSaveData
		)
			return

		const updatedSteps = [...quest.steps]
		;[updatedSteps[stepIndex], updatedSteps[stepIndex + 1]] = [
			updatedSteps[stepIndex + 1],
			updatedSteps[stepIndex],
		]

		const updatedQuests = quests.map((q) =>
			q.id === questId ? { ...q, steps: updatedSteps } : q
		)

		const updatedGameData: Game = {
			...gameData,
			quests: updatedQuests,
		}

		onSetGameData(updatedGameData)
		onSaveData(updatedGameData).catch((error) => {
			console.error('Error moving quest step down:', error)
		})
	}

	const handleRemoveQuestStep = (questId: string, stepIndex: number) => {
		const quest = quests.find((q) => q.id === questId)
		if (!quest || !quest.steps[stepIndex]) return

		const step = quest.steps[stepIndex]
		confirmDialog.openConfirmDialog(
			'Remove Quest Step',
			`Are you sure you want to remove the quest step "${step.name}"? This action cannot be undone.`,
			() => {
				const updatedSteps = quest.steps.filter((_, i) => i !== stepIndex)
				const updatedQuests = quests.map((q) =>
					q.id === questId ? { ...q, steps: updatedSteps } : q
				)

				const updatedGameData: Game = {
					...gameData,
					quests: updatedQuests,
				}

				if (onSetGameData && onSaveData) {
					onSetGameData(updatedGameData)
					onSaveData(updatedGameData).catch((error) => {
						console.error('Error removing quest step:', error)
					})
				}
				confirmDialog.closeConfirmDialog()
			},
			() => {
				confirmDialog.closeConfirmDialog()
			}
		)
	}

	// Helper function to get NPC name by ID
	const getNpcName = (npcId: string) => {
		const npc = npcs.find((n) => n.id === npcId)
		return npc ? npc.name : `NPC ${npcId}`
	}

	// Helper function to get NPC object by ID
	const getNpcById = (npcId: string) => {
		return npcs.find((n) => n.id === npcId)
	}

	// Helper function to get dialogues for a specific quest step
	const getDialoguesForStep = (questStepId: string) => {
		return dialogues.filter((dialogue) => dialogue.questStepId === questStepId)
	}

	// Helper function to get auto-started dialogues from quest actions
	const getAutoStartedDialoguesForStep = (step: any) => {
		const autoStartedIds: string[] = []

		// Check onStart actions
		if (step.onStart) {
			step.onStart.forEach((action: any) => {
				if (
					action.type === 'startDialogue' &&
					action.params?.dialogueSequenceId
				) {
					autoStartedIds.push(action.params.dialogueSequenceId)
				}
			})
		}

		// Check onComplete actions
		if (step.onComplete) {
			step.onComplete.forEach((action: any) => {
				if (
					action.type === 'startDialogue' &&
					action.params?.dialogueSequenceId
				) {
					autoStartedIds.push(action.params.dialogueSequenceId)
				}
			})
		}

		return dialogues.filter((dialogue) => autoStartedIds.includes(dialogue.id))
	}

	// Render inline dialogue editor for a dialogue sequence
	const renderInlineDialogueEditor = (
		dialogue: DialogueSequence | Partial<DialogueSequence>,
		questStepId: string,
		isNew: boolean = false
	) => {
		const dialogs = dialogue.dialogs || []
		const isExpanded =
			expandedDialogues[isNew ? questStepId : dialogue.id!] || false
		const isExistingEditing =
			!isNew && dialogue.id
				? editingDialogues[dialogue.id] !== undefined
				: false
		const showSequenceDetailsForm = isNew || isExistingEditing

		return (
			<div className='space-y-3'>
				{/* Dialogue Sequence Header */}
				<div className='flex items-center justify-between mb-2'>
					<div className='flex-1 space-y-2'>
						{showSequenceDetailsForm ? (
							<>
								<input
									type='text'
									value={dialogue.name || ''}
									onChange={(e) =>
										isNew
											? handleUpdateNewDialogue(questStepId, {
													name: e.target.value,
											  })
											: dialogue.id
											? handleUpdateEditingDialogue(dialogue.id, {
													name: e.target.value,
											  })
											: undefined
									}
									placeholder='Dialogue sequence name'
									className='w-full px-2 py-1 text-sm border border-border-primary rounded bg-bg-primary text-text-primary'
								/>
								<select
									value={dialogue.npcId || ''}
									onChange={(e) =>
										isNew
											? handleUpdateNewDialogue(questStepId, {
													npcId: e.target.value || undefined,
											  })
											: dialogue.id
											? handleUpdateEditingDialogue(dialogue.id, {
													npcId: e.target.value || undefined,
											  })
											: undefined
									}
									className='w-full px-2 py-1 text-sm border border-border-primary rounded bg-bg-primary text-text-primary'
								>
									<option value=''>Select NPC</option>
									{npcs.map((npc) => (
										<option key={npc.id} value={npc.id}>
											{npc.name}
										</option>
									))}
								</select>
							</>
						) : (
							<div className='flex items-center space-x-2'>
								<button
									onClick={() => handleToggleEditDialogue(dialogue.id!)}
									className='text-xs px-2 py-1 bg-primary/20 hover:bg-primary/30 rounded transition-colors'
								>
									{isExpanded ? '▼' : '▶'} Edit
								</button>
								<span className='text-text-secondary text-sm'>
									{dialogue.name}
								</span>
							</div>
						)}
					</div>
					{isNew && (
						<button
							onClick={() => handleCancelNewDialogue(questStepId)}
							className='text-danger hover:text-danger-hover text-xs px-2 py-1'
						>
							× Cancel
						</button>
					)}
					{isExistingEditing && dialogue.id && (
						<button
							onClick={() => handleToggleEditDialogue(dialogue.id as string)}
							className='text-danger hover:text-danger-hover text-xs px-2 py-1'
						>
							× Cancel
						</button>
					)}
				</div>

				{/* Dialogs List */}
				{isExpanded && (
					<div className='space-y-3 pl-4 border-l-2 border-border-secondary'>
						{dialogs.map((dialog, dialogIndex) => {
							const isEditing = isNew
								? true
								: editingDialogues[dialogue.id!] !== undefined
							const isLastDialog = dialogIndex === dialogs.length - 1
							const shouldBeEndOfDialog = isLastDialog
							const shouldBeContinue = !isLastDialog

							// Auto-correct dialog type based on position
							const correctedDialog = {
								...dialog,
								isEndOfDialog: shouldBeEndOfDialog,
							}

							return (
								<div
									key={dialog.id}
									className='bg-bg-hover p-3 rounded space-y-2'
								>
									{/* Dialog Text */}
									<textarea
										value={correctedDialog.text}
										onChange={(e) => {
											if (isNew) {
												handleUpdateDialogInNew(questStepId, dialogIndex, {
													text: e.target.value,
												})
											} else {
												handleUpdateDialogInEditing(dialogue.id!, dialogIndex, {
													text: e.target.value,
												})
											}
										}}
										rows={3}
										placeholder='Enter dialogue text...'
										className='w-full px-2 py-1 text-sm border border-border-primary rounded bg-bg-primary text-text-primary resize-none'
									/>

									{/* Dialog Type Buttons */}
									<div className='flex gap-2'>
										<button
											type='button'
											onClick={() => {
												if (isNew) {
													handleUpdateDialogInNew(questStepId, dialogIndex, {
														isQuestion: true,
														isEndOfDialog: shouldBeEndOfDialog,
													})
												} else {
													handleUpdateDialogInEditing(
														dialogue.id!,
														dialogIndex,
														{
															isQuestion: true,
															isEndOfDialog: shouldBeEndOfDialog,
														}
													)
												}
											}}
											className={`text-xs px-2 py-1 rounded transition-colors ${
												correctedDialog.isQuestion
													? 'bg-primary text-white'
													: 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
											}`}
										>
											Is Question
										</button>
										<button
											type='button'
											disabled={!isLastDialog}
											className={`text-xs px-2 py-1 rounded transition-colors ${
												correctedDialog.isEndOfDialog
													? 'bg-warning text-white'
													: 'bg-bg-secondary text-text-secondary opacity-50'
											} ${
												isLastDialog ? 'cursor-pointer' : 'cursor-not-allowed'
											}`}
											title={
												isLastDialog
													? 'This dialog is the last in the sequence and will end the dialogue'
													: 'Only the last dialog in a sequence can be "End of Dialog"'
											}
										>
											End of Dialog
										</button>
										<button
											type='button'
											disabled={isLastDialog}
											className={`text-xs px-2 py-1 rounded transition-colors ${
												!correctedDialog.isQuestion &&
												!correctedDialog.isEndOfDialog
													? 'bg-secondary text-white'
													: 'bg-bg-secondary text-text-secondary opacity-50'
											} ${
												!isLastDialog ? 'cursor-pointer' : 'cursor-not-allowed'
											}`}
											title={
												!isLastDialog
													? 'This dialog continues to the next one in the sequence'
													: 'The last dialog in a sequence cannot continue'
											}
										>
											Continue
										</button>
										<button
											type='button'
											onClick={() => {
												if (isNew) {
													handleRemoveDialogFromNew(questStepId, dialogIndex)
												} else {
													handleRemoveDialogFromEditing(
														dialogue.id!,
														dialogIndex
													)
												}
											}}
											className='text-xs px-2 py-1 rounded bg-danger/20 text-danger hover:bg-danger/30 transition-colors'
										>
											Remove
										</button>
									</div>

									{/* Buttons Section (if isQuestion) */}
									{dialog.isQuestion && (
										<div className='space-y-2 pl-4 border-l-2 border-secondary/30'>
											<label className='text-xs text-text-secondary'>
												Buttons:
											</label>
											{(dialog.buttons || []).map((button, buttonIndex) => (
												<div
													key={buttonIndex}
													className='flex gap-2 items-center bg-secondary/10 p-2 rounded'
												>
													<input
														type='text'
														value={button.label}
														onChange={(e) => {
															if (isNew) {
																handleUpdateButtonInNew(
																	questStepId,
																	dialogIndex,
																	buttonIndex,
																	{ label: e.target.value }
																)
															} else {
																handleUpdateButtonInEditing(
																	dialogue.id!,
																	dialogIndex,
																	buttonIndex,
																	{ label: e.target.value }
																)
															}
														}}
														placeholder='Button label'
														className='flex-1 px-2 py-1 text-xs border border-border-primary rounded bg-bg-primary text-text-primary'
													/>
													<select
														value={button.goToDialog}
														onChange={(e) => {
															if (isNew) {
																handleUpdateButtonInNew(
																	questStepId,
																	dialogIndex,
																	buttonIndex,
																	{
																		goToDialog: parseInt(e.target.value),
																	}
																)
															} else {
																handleUpdateButtonInEditing(
																	dialogue.id!,
																	dialogIndex,
																	buttonIndex,
																	{
																		goToDialog: parseInt(e.target.value),
																	}
																)
															}
														}}
														className='px-2 py-1 text-xs border border-border-primary rounded bg-bg-primary text-text-primary'
													>
														{dialogs.map((_, idx) => (
															<option key={idx} value={idx}>
																Dialog {idx}
															</option>
														))}
													</select>
													<input
														type='number'
														value={button.size}
														onChange={(e) => {
															if (isNew) {
																handleUpdateButtonInNew(
																	questStepId,
																	dialogIndex,
																	buttonIndex,
																	{
																		size: parseInt(e.target.value) || 300,
																	}
																)
															} else {
																handleUpdateButtonInEditing(
																	dialogue.id!,
																	dialogIndex,
																	buttonIndex,
																	{
																		size: parseInt(e.target.value) || 300,
																	}
																)
															}
														}}
														min='100'
														max='1000'
														className='w-20 px-2 py-1 text-xs border border-border-primary rounded bg-bg-primary text-text-primary'
													/>
													<button
														type='button'
														onClick={() => {
															if (isNew) {
																handleRemoveButtonFromNew(
																	questStepId,
																	dialogIndex,
																	buttonIndex
																)
															} else {
																handleRemoveButtonFromEditing(
																	dialogue.id!,
																	dialogIndex,
																	buttonIndex
																)
															}
														}}
														className='text-xs px-2 py-1 rounded bg-danger/20 text-danger hover:bg-danger/30 transition-colors'
													>
														×
													</button>
												</div>
											))}
											<button
												type='button'
												onClick={() => {
													if (isNew) {
														handleAddButtonToNew(questStepId, dialogIndex)
													} else {
														handleAddButtonToEditing(dialogue.id!, dialogIndex)
													}
												}}
												className='text-xs px-2 py-1 rounded bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors'
											>
												+ Add Button
											</button>
										</div>
									)}
								</div>
							)
						})}

						{/* Add Dialog Button */}
						<button
							type='button'
							onClick={() => {
								if (isNew) {
									handleAddDialogToNew(questStepId)
								} else {
									handleAddDialogToEditing(dialogue.id!)
								}
							}}
							className='w-full text-xs px-3 py-2 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors border border-dashed border-primary/30'
						>
							+ Add Dialog
						</button>
					</div>
				)}
			</div>
		)
	}

	return (
		<div className='w-full space-y-6'>
			<div className='mb-6'>
				<h2 className='text-xl font-primary text-text-primary mb-2'>
					Quest Overview
				</h2>
				<p className='text-text-secondary text-sm'>
					See which dialogues are connected to which quest steps
				</p>
			</div>

			<div className='w-full text-sm'>
				{/* Header Row */}
				<div className='flex w-full border-b border-border-primary mb-4'>
					<div className='w-3/12 font-primary text-primary uppercase tracking-wider py-2'>
						Quest
					</div>
					<div className='w-2/12 font-primary text-primary uppercase tracking-wider py-2'>
						Quest Step
					</div>
					<div className='w-7/12 font-primary text-primary uppercase tracking-wider py-2'>
						NPC Dialogues & Content
					</div>
				</div>

				{/* Quest Rows */}
				<div className='space-y-6'>
					{quests.map((quest) => (
						<div key={quest.id} className='space-y-3'>
							{quest.steps.map((step, stepIndex) => (
								<div key={step.id} className='flex w-full gap-4'>
									{/* Quest Column - only show on first step */}
									{stepIndex === 0 ? (
										<div className='w-3/12'>
											<Card variant='hover' padding='md'>
												<h3 className='font-primary text-text-primary text-lg mb-2'>
													{quest.title}
												</h3>
												<p className='text-text-secondary text-sm mb-1'>
													{quest.chapter}
												</p>
												<p className='text-text-muted text-xs'>
													Order: {quest.order} • {quest.steps.length} steps
												</p>
											</Card>
										</div>
									) : (
										<div className='w-3/12 h-full' />
									)}

									{/* Step Column */}
									<div className='w-2/12'>
										<Card variant='default' padding='sm' className='h-full'>
											<div className='flex items-center justify-between mb-2'>
												<h4 className='font-primary text-text-primary text-sm'>
													{step.name}
												</h4>
												<div className='flex gap-1'>
													{/* Edit Button */}
													<button
														type='button'
														onClick={() =>
															handleEditQuestStep(quest.id, stepIndex)
														}
														className='text-xs px-1.5 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors'
														title='Edit quest step'
													>
														✎
													</button>
													{/* Move Up Button */}
													{stepIndex > 0 && (
														<button
															type='button'
															onClick={() =>
																handleMoveQuestStepUp(quest.id, stepIndex)
															}
															className='text-xs px-1.5 py-1 rounded bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors'
															title='Move step up'
														>
															↑
														</button>
													)}
													{/* Move Down Button */}
													{stepIndex < quest.steps.length - 1 && (
														<button
															type='button'
															onClick={() =>
																handleMoveQuestStepDown(quest.id, stepIndex)
															}
															className='text-xs px-1.5 py-1 rounded bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors'
															title='Move step down'
														>
															↓
														</button>
													)}
													{/* Delete Button */}
													<button
														type='button'
														onClick={() =>
															handleRemoveQuestStep(quest.id, stepIndex)
														}
														className='text-xs px-1.5 py-1 rounded bg-danger/20 text-danger hover:bg-danger/30 transition-colors'
														title='Remove quest step'
													>
														×
													</button>
												</div>
											</div>

											{/* Objective Type & Params */}
											<div className='mb-3'>
												<p className='text-text-secondary text-xs font-medium mb-1'>
													🎯{' '}
													{step.objectiveType
														.replace(/([A-Z])/g, ' $1')
														.toLowerCase()}
												</p>
												{step.objectiveParams &&
													Object.keys(step.objectiveParams).length > 0 && (
														<div className='text-text-muted text-xs space-y-1'>
															{Object.entries(step.objectiveParams).map(
																([key, value]) => (
																	<div
																		key={key}
																		className='flex justify-between'
																	>
																		<span className='capitalize'>
																			{key
																				.replace(/([A-Z])/g, ' $1')
																				.toLowerCase()}
																			:
																		</span>
																		<span className='text-primary font-medium'>
																			{String(value)}
																		</span>
																	</div>
																)
															)}
														</div>
													)}
											</div>

											{/* On Start Actions */}
											{step.onStart && step.onStart.length > 0 && (
												<div className='mb-3'>
													<p className='text-success text-xs font-medium mb-1'>
														▶ START:
													</p>
													<div className='space-y-1'>
														{step.onStart.map((action, idx) => (
															<div
																key={idx}
																className='text-success text-xs bg-success/10 p-1 rounded'
															>
																{action.type}
																{action.params &&
																	Object.keys(action.params).length > 0 && (
																		<span className='ml-1 text-text-muted'>
																			({Object.values(action.params).join(', ')}
																			)
																		</span>
																	)}
															</div>
														))}
													</div>
												</div>
											)}

											{/* On Complete Actions */}
											{step.onComplete && step.onComplete.length > 0 && (
												<div>
													<p className='text-warning text-xs font-medium mb-1'>
														✓ COMPLETE:
													</p>
													<div className='space-y-1'>
														{step.onComplete.map((action, idx) => (
															<div
																key={idx}
																className='text-warning text-xs bg-warning/10 p-1 rounded'
															>
																{action.type}
																{action.params &&
																	Object.keys(action.params).length > 0 && (
																		<span className='ml-1 text-text-muted'>
																			({Object.values(action.params).join(', ')}
																			)
																		</span>
																	)}
															</div>
														))}
													</div>
												</div>
											)}
										</Card>
									</div>

									{/* Dialogues & Content Column */}
									<div className='w-7/12'>
										<div className='space-y-3'>
											{(() => {
												const questStepDialogues = getDialoguesForStep(step.id)
												const autoStartedDialogues =
													getAutoStartedDialoguesForStep(step)

												// Separate the dialogues into categories for ordering
												const linkedDialogues = questStepDialogues.filter(
													(d) =>
														!autoStartedDialogues.some((ad) => ad.id === d.id)
												)
												const autoStartedOnlyDialogues =
													autoStartedDialogues.filter(
														(d) =>
															!questStepDialogues.some((ld) => ld.id === d.id)
													)
												const overlappingDialogues = questStepDialogues.filter(
													(d) =>
														autoStartedDialogues.some((ad) => ad.id === d.id)
												)

												// Order: Linked (teal) -> Overlapping (green) -> Auto-started (yellow)
												const orderedDialogues = [
													...linkedDialogues,
													...overlappingDialogues,
													...autoStartedOnlyDialogues,
												]

												// Check if there's a new dialogue being created for this step
												const newDialogue = newDialogues[step.id]

												return (
													<>
														{/* New Dialogue Creation */}
														{newDialogue && (
															<Card
																variant='default'
																padding='md'
																className='border-primary'
															>
																{renderInlineDialogueEditor(
																	newDialogue,
																	step.id,
																	true
																)}
															</Card>
														)}

														{/* Existing Dialogues */}
														{orderedDialogues.length > 0 ? (
															orderedDialogues.map((dialogue) => {
																const isLinked = questStepDialogues.some(
																	(d) => d.id === dialogue.id
																)
																const isAutoStarted = autoStartedDialogues.some(
																	(d) => d.id === dialogue.id
																)
																const isOverlapping = isLinked && isAutoStarted
																const isTalkToStep =
																	step.objectiveType === 'talkTo'
																const isTargetNpc =
																	isTalkToStep &&
																	dialogue.npcId === step.objectiveParams?.npcId

																let cardVariant: string = 'interactive'
																let cardClassName = 'cursor-pointer'
																let statusBadge = null

																if (isAutoStarted) {
																	// Yellow for auto-started dialogues (takes priority)
																	statusBadge = (
																		<span className='text-warning text-xs font-medium px-2 py-1 bg-warning/20 rounded'>
																			AUTO-START
																		</span>
																	)
																	cardVariant = 'default'
																	cardClassName =
																		'cursor-pointer border-warning bg-warning/10'
																} else if (isLinked) {
																	// Red for dialogues of the target NPC in talkTo steps, teal for others
																	const badgeColor = isTargetNpc
																		? 'danger'
																		: 'primary'
																	const badgeText = isTargetNpc
																		? '🎯 TALK TRIGGER'
																		: '🔗 LINKED'
																	statusBadge = (
																		<span
																			className={`text-${badgeColor} text-xs font-medium px-2 py-1 bg-${badgeColor}/20 rounded flex items-center`}
																		>
																			{badgeText}
																		</span>
																	)
																}

																// Use editing version if available, otherwise use original
																const dialogueToRender =
																	editingDialogues[dialogue.id] || dialogue
																const isEditing =
																	editingDialogues[dialogue.id] !== undefined

																return (
																	<Card
																		key={dialogue.id}
																		variant={cardVariant as any}
																		padding='md'
																		className={cardClassName}
																		onMouseEnter={() => {
																			setHoveredDialogueId(dialogue.id)
																		}}
																		onMouseLeave={() => {
																			setHoveredDialogueId(null)
																		}}
																	>
																		{/* Status Indicator */}
																		<div className='flex items-center justify-between mb-2'>
																			<div className='flex items-center space-x-2'>
																				{statusBadge}
																			</div>
																			{hoveredDialogueId === dialogue.id && (
																				<div className='flex items-center gap-2'>
																					<button
																						type='button'
																						onClick={() =>
																							handleToggleEditDialogue(
																								dialogue.id
																							)
																						}
																						className='text-xs px-2 py-1 bg-primary/15 text-primary hover:bg-primary/25 rounded transition-colors'
																						title='Edit dialogue sequence'
																					>
																						✎ Edit Sequence
																					</button>
																					<button
																						type='button'
																						onClick={() =>
																							handleRemoveDialogueSequence(
																								dialogue.id
																							)
																						}
																						className='text-danger hover:text-danger-hover text-xs px-2 py-1 bg-danger/10 hover:bg-danger/20 rounded transition-colors'
																						title='Remove dialogue sequence'
																					>
																						× Remove Sequence
																					</button>
																				</div>
																			)}
																		</div>
																		{/* NPC Header */}
																		<div className='flex items-center space-x-3 mb-3 pb-2 border-b border-border-secondary'>
																			{(() => {
																				const npc = getNpcById(
																					dialogue.npcId || ''
																				)
																				const displayImage =
																					npc?.image && projectPath
																						? projectPath + npc.image
																						: npc?.image || ''

																				return (
																					<>
																						{npc?.image && (
																							<ImageDisplay
																								src={displayImage}
																								alt={`${npc.name} avatar`}
																								className='w-8 h-8 rounded-sm object-cover flex-shrink-0'
																								fallback={
																									<div className='w-8 h-8 rounded-sm bg-bg-hover flex items-center justify-center text-sm text-text-muted'>
																										?
																									</div>
																								}
																							/>
																						)}
																						<div>
																							<span className='font-primary text-secondary text-sm block'>
																								{getNpcName(
																									dialogue.npcId || ''
																								)}
																							</span>
																							<span className='text-text-muted text-xs'>
																								{dialogue.name}
																							</span>
																						</div>
																					</>
																				)
																			})()}
																		</div>

																		{/* Dialog Content - Show inline editor if editing, otherwise show read-only */}
																		{isEditing ? (
																			renderInlineDialogueEditor(
																				dialogueToRender,
																				step.id,
																				false
																			)
																		) : (
																			<div
																				className='space-y-4'
																				onMouseEnter={() => {
																					setHoveredDialogueId(dialogue.id)
																				}}
																				onMouseLeave={() => {
																					setHoveredDialogueId(null)
																				}}
																			>
																				{(
																					editingDialogues[dialogue.id]
																						?.dialogs || dialogue.dialogs
																				).map((dialog, dialogIndex) => {
																					const currentText =
																						editedDialogues[dialog.id] ??
																						dialog.text
																					const hasBeenEdited =
																						editedDialogues[dialog.id] !==
																						undefined
																					const originalText =
																						originalDialogues[dialog.id] ??
																						dialog.text
																					const isHovered =
																						hoveredDialogueId === dialogue.id

																					return (
																						<div
																							key={dialog.id}
																							className='space-y-2 relative group'
																						>
																							{/* Dialog Text */}
																							<div className='bg-bg-hover p-3 rounded border-l-2 border-primary'>
																								<div className='flex items-start gap-2'>
																									<textarea
																										value={currentText}
																										onChange={(e) =>
																											handleDialogueChange(
																												dialog.id,
																												e.target.value,
																												originalText
																											)
																										}
																										className='flex-1 text-text-primary text-sm leading-relaxed bg-transparent border-none outline-none resize-none min-h-[2rem]'
																										rows={Math.max(
																											2,
																											currentText.split('\n')
																												.length
																										)}
																										placeholder='Enter dialogue text...'
																									/>
																									<div className='flex gap-1 flex-shrink-0'>
																										{hasBeenEdited && (
																											<button
																												onClick={() =>
																													handleRevertDialogue(
																														dialog.id
																													)
																												}
																												className='text-warning hover:text-warning-hover text-xs px-2 py-1 bg-warning/10 hover:bg-warning/20 rounded transition-colors'
																												title='Revert to original text'
																											>
																												↻
																											</button>
																										)}
																										{isHovered && (
																											<button
																												type='button'
																												onClick={() =>
																													handleQuickRemoveDialog(
																														dialogue.id,
																														dialogIndex
																													)
																												}
																												className='text-danger hover:text-danger-hover text-xs px-2 py-1 bg-danger/10 hover:bg-danger/20 rounded transition-colors'
																												title='Remove dialog'
																											>
																												×
																											</button>
																										)}
																									</div>
																								</div>
																							</div>

																							{/* Response Buttons */}
																							{dialog.isQuestion &&
																								dialog.buttons &&
																								dialog.buttons.length > 0 && (
																									<div className='ml-4 space-y-1'>
																										<p className='text-text-muted text-xs italic mb-2'>
																											Responses:
																										</p>
																										{dialog.buttons.map(
																											(button, buttonIndex) => (
																												<div
																													key={buttonIndex}
																													className='bg-secondary/20 border border-secondary/30 p-2 rounded text-xs'
																												>
																													<span className='text-secondary font-medium'>
																														{button.label}
																													</span>
																													<span className='text-text-muted ml-2'>
																														→ Dialog{' '}
																														{button.goToDialog}
																													</span>
																												</div>
																											)
																										)}
																									</div>
																								)}
																						</div>
																					)
																				})}
																				{hoveredDialogueId === dialogue.id && (
																					<div className='pt-2'>
																						<button
																							type='button'
																							onClick={() =>
																								handleQuickAddDialog(
																									dialogue.id
																								)
																							}
																							className='text-xs px-2 py-1 text-text-muted hover:text-primary transition-colors opacity-60 hover:opacity-100'
																							title='Add dialog'
																						>
																							+ Add Dialog
																						</button>
																					</div>
																				)}
																			</div>
																		)}
																	</Card>
																)
															})
														) : (
															<div className='text-text-muted text-xs italic py-2 px-3 bg-bg-hover rounded border border-dashed border-border-secondary'>
																No dialogues attached
															</div>
														)}

														{/* Add Dialogue Sequence Button */}
														{!newDialogue && (
															<button
																type='button'
																onClick={() => handleStartNewDialogue(step.id)}
																className='text-xs px-2 py-1 text-text-muted hover:text-primary transition-colors opacity-60 hover:opacity-100'
																title='Add new dialogue sequence'
															>
																+ Add Dialog Sequence
															</button>
														)}
													</>
												)
											})()}
										</div>
									</div>
								</div>
							))}

							{/* Add Quest Step Button */}
							<div className='flex w-full gap-4'>
								<div className='w-3/12' />
								<div className='w-2/12'>
									<button
										type='button'
										onClick={() => handleAddQuestStep(quest.id)}
										className='w-full text-xs px-2 py-2 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors border border-dashed border-primary/30'
										title='Add new quest step'
									>
										+ Add Quest Step
									</button>
								</div>
								<div className='w-7/12' />
							</div>

							{/* Separator between quests */}
							{quest !== quests[quests.length - 1] && (
								<div className='border-t border-border-secondary my-6' />
							)}
						</div>
					))}
				</div>
			</div>

			{/* Quest Step Edit Modal */}
			<QuestStepEditModal
				isOpen={stepModalOpen}
				step={editingStep}
				npcs={gameData.npcs || []}
				items={gameData.items || []}
				locations={gameData.locations || []}
				quests={quests}
				dialogues={dialogues}
				portals={gameData.portals || []}
				onSave={handleSaveQuestStep}
				onCancel={handleCancelStepEdit}
			/>

			{/* Confirmation Dialog */}
			<ConfirmDialog confirmDialog={confirmDialog.confirmDialog} />
		</div>
	)
}
