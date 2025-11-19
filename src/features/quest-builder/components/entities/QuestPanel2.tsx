import React, { useState, useEffect, useCallback } from 'react'
import {
	Quest,
	DialogueSequence,
	NPC,
	Game,
	Dialog,
	Button,
} from '@/core/models/types'
import { Card } from '@/shared/ui'
import { ImageDisplay } from '@/shared/components/ui/ImagePicker'
import { generateIdFromApi } from '@/shared/utils/api'

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

	useEffect(() => {
		const getProjectPath = async () => {
			const electronAPI = (window as any).electronAPI
			const path = electronAPI
				? await electronAPI.getQuestEditorProjectPath()
				: null
			setProjectPath(path)
		}
		getProjectPath()
	}, [])

	// Auto-save function with debouncing
	const autoSave = useCallback(async () => {
		if (!onSetGameData || !onSaveData) {
			console.log('QuestPanel2: Auto-save skipped - missing handlers')
			return
		}

		try {
			console.log(
				'QuestPanel2: Starting auto-save with edited dialogues:',
				Object.keys(editedDialogues)
			)

			// Start with existing dialogues
			let updatedDialogues = [...dialogues]

			// Update all dialogues that have edited dialogs (text-only)
			updatedDialogues = updatedDialogues.map((dialogue) => {
				const hasEditedDialogs = dialogue.dialogs.some(
					(dialog) => editedDialogues[dialog.id] !== undefined
				)

				if (hasEditedDialogs) {
					console.log(`QuestPanel2: Updating dialogue ${dialogue.id}`)
					// Update this dialogue sequence with edited dialog texts
					const updatedDialogs = dialogue.dialogs.map((dialog) =>
						editedDialogues[dialog.id] !== undefined
							? { ...dialog, text: editedDialogues[dialog.id] }
							: dialog
					)

					return { ...dialogue, dialogs: updatedDialogs }
				}

				return dialogue
			})

			// Update dialogues that are being edited inline
			updatedDialogues = updatedDialogues.map((dialogue) => {
				if (editingDialogues[dialogue.id]) {
					return editingDialogues[dialogue.id]
				}
				return dialogue
			})

			// Add new dialogue sequences that are complete (have name, npcId, and at least one dialog)
			Object.entries(newDialogues).forEach(([questStepId, newDialogue]) => {
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
			})

			// Create the updated game data
			const updatedGameData: Game = {
				...gameData,
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
	}, [
		dialogues,
		editedDialogues,
		editingDialogues,
		newDialogues,
		gameData,
		onSetGameData,
		onSaveData,
	])

	// Handle input changes
	const handleDialogueChange = (
		dialogId: string,
		newText: string,
		originalText: string
	) => {
		setEditedDialogues((prev) => ({ ...prev, [dialogId]: newText }))

		// Store original text if not already stored
		if (!originalDialogues[dialogId]) {
			setOriginalDialogues((prev) => ({ ...prev, [dialogId]: originalText }))
		}

		// Auto-save after a short delay
		setTimeout(() => autoSave(), 500)
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
			isEndOfDialog: false,
		}

		setNewDialogues((prev) => {
			const current = prev[questStepId] || { dialogs: [] }
			return {
				...prev,
				[questStepId]: {
					...current,
					dialogs: [...(current.dialogs || []), newDialog],
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

			const updatedDialogs = current.dialogs.filter(
				(_: Dialog, i: number) => i !== dialogIndex
			)

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
			isEndOfDialog: false,
		}

		setEditingDialogues((prev) => {
			const current = prev[dialogueId]
			if (!current) return prev

			return {
				...prev,
				[dialogueId]: {
					...current,
					dialogs: [...current.dialogs, newDialog],
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

			const updatedDialogs = current.dialogs.filter(
				(_: Dialog, i: number) => i !== dialogIndex
			)

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
			isEndOfDialog: false,
		}

		// If already in editing state, update it, otherwise create editing state
		if (editingDialogues[dialogueId]) {
			setEditingDialogues((prev) => ({
				...prev,
				[dialogueId]: {
					...prev[dialogueId],
					dialogs: [...prev[dialogueId].dialogs, newDialog],
				},
			}))
		} else {
			setEditingDialogues((prev) => ({
				...prev,
				[dialogueId]: {
					...dialogue,
					dialogs: [...dialogue.dialogs, newDialog],
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

		// If already in editing state, update it, otherwise create editing state
		if (editingDialogues[dialogueId]) {
			const updatedDialogs = editingDialogues[dialogueId].dialogs.filter(
				(_: Dialog, i: number) => i !== dialogIndex
			)
			setEditingDialogues((prev) => ({
				...prev,
				[dialogueId]: {
					...prev[dialogueId],
					dialogs: updatedDialogs,
				},
			}))
		} else {
			const updatedDialogs = dialogue.dialogs.filter(
				(_: Dialog, i: number) => i !== dialogIndex
			)
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

		return (
			<div className='space-y-3'>
				{/* Dialogue Sequence Header */}
				<div className='flex items-center justify-between mb-2'>
					<div className='flex-1 space-y-2'>
						{isNew ? (
							<>
								<input
									type='text'
									value={dialogue.name || ''}
									onChange={(e) =>
										handleUpdateNewDialogue(questStepId, {
											name: e.target.value,
										})
									}
									placeholder='Dialogue sequence name'
									className='w-full px-2 py-1 text-sm border border-border-primary rounded bg-bg-primary text-text-primary'
								/>
								<select
									value={dialogue.npcId || ''}
									onChange={(e) =>
										handleUpdateNewDialogue(questStepId, {
											npcId: e.target.value || undefined,
										})
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
				</div>

				{/* Dialogs List */}
				{isExpanded && (
					<div className='space-y-3 pl-4 border-l-2 border-border-secondary'>
						{dialogs.map((dialog, dialogIndex) => {
							const isEditing = isNew
								? true
								: editingDialogues[dialogue.id!] !== undefined

							return (
								<div
									key={dialog.id}
									className='bg-bg-hover p-3 rounded space-y-2'
								>
									{/* Dialog Text */}
									<textarea
										value={dialog.text}
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
														isEndOfDialog: false,
													})
												} else {
													handleUpdateDialogInEditing(
														dialogue.id!,
														dialogIndex,
														{
															isQuestion: true,
															isEndOfDialog: false,
														}
													)
												}
											}}
											className={`text-xs px-2 py-1 rounded transition-colors ${
												dialog.isQuestion
													? 'bg-primary text-white'
													: 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
											}`}
										>
											Is Question
										</button>
										<button
											type='button'
											onClick={() => {
												if (isNew) {
													handleUpdateDialogInNew(questStepId, dialogIndex, {
														isQuestion: false,
														isEndOfDialog: true,
													})
												} else {
													handleUpdateDialogInEditing(
														dialogue.id!,
														dialogIndex,
														{
															isQuestion: false,
															isEndOfDialog: true,
														}
													)
												}
											}}
											className={`text-xs px-2 py-1 rounded transition-colors ${
												dialog.isEndOfDialog
													? 'bg-warning text-white'
													: 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
											}`}
										>
											End of Dialog
										</button>
										<button
											type='button'
											onClick={() => {
												if (isNew) {
													handleUpdateDialogInNew(questStepId, dialogIndex, {
														isQuestion: false,
														isEndOfDialog: false,
													})
												} else {
													handleUpdateDialogInEditing(
														dialogue.id!,
														dialogIndex,
														{
															isQuestion: false,
															isEndOfDialog: false,
														}
													)
												}
											}}
											className={`text-xs px-2 py-1 rounded transition-colors ${
												!dialog.isQuestion && !dialog.isEndOfDialog
													? 'bg-secondary text-white'
													: 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
											}`}
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
											<h4 className='font-primary text-text-primary text-sm mb-2'>
												{step.name}
											</h4>

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

																if (isOverlapping) {
																	// Green for overlapping (both linked and auto-started)
																	statusBadge = (
																		<span className='text-success text-xs font-medium px-2 py-1 bg-success/20 rounded flex items-center'>
																			✓ LINKED & AUTO
																		</span>
																	)
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
																} else if (isAutoStarted) {
																	// Yellow for auto-started only
																	statusBadge = (
																		<span className='text-warning text-xs font-medium px-2 py-1 bg-warning/20 rounded'>
																			AUTO-START
																		</span>
																	)
																	cardVariant = 'default'
																	cardClassName =
																		'cursor-pointer border-warning bg-warning/10'
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
																	>
																		{/* Status Indicator */}
																		<div className='flex items-center justify-between mb-2'>
																			<div className='flex items-center space-x-2'>
																				{statusBadge}
																			</div>
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
																				{/* Quick Add button on hover */}
																				{hoveredDialogueId === dialogue.id && (
																					<div className='flex gap-2 mb-2'>
																						<button
																							type='button'
																							onClick={() =>
																								handleQuickAddDialog(
																									dialogue.id
																								)
																							}
																							className='text-xs px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors'
																							title='Add dialog to sequence'
																						>
																							+ Add Dialog
																						</button>
																					</div>
																				)}

																				{(isTalkToStep
																					? (
																							editingDialogues[dialogue.id]
																								?.dialogs || dialogue.dialogs
																					  ).slice(0, 1)
																					: editingDialogues[dialogue.id]
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
																+ Add Dialogue
															</button>
														)}
													</>
												)
											})()}
										</div>
									</div>
								</div>
							))}

							{/* Separator between quests */}
							{quest !== quests[quests.length - 1] && (
								<div className='border-t border-border-secondary my-6' />
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
