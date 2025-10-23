import React, { useState, useEffect, useRef } from 'react'
import {
	Location,
	Quest,
	NPC,
	Item,
	Portal,
	Game,
	InteractiveMode,
	ActionType,
	DialogueSequence,
	QuestStep,
	EntityState,
} from '@/core/models/types'
import { loadGameData, saveGameData, generateId } from '@/shared/utils/api'
import { NotificationContainer } from './Notification'
import { EditModal } from './EditModal'
import { QuestStepSelector } from './modals/QuestStepSelector'
import { BuilderTabs } from './layout/BuilderTabs'
import { BuilderHeader } from './layout/BuilderHeader'
import { LinksPanel } from './entities/LinksPanel'
import { DialoguePanel } from './entities/DialoguePanel'
import { LocationPanel } from './entities/LocationPanel'
import { QuestPanel } from './entities/QuestPanel'
import { NPCPanel } from './entities/NPCPanel'
import { ItemPanel } from './entities/ItemPanel'
import { PortalPanel } from './entities/PortalPanel'
import { Project } from '@/shared/types'

// Import all CSS files
import '@/shared/styles/base.css'
import '@/shared/styles/header.css'
import '@/shared/styles/tabs.css'
import '@/shared/styles/entity-panel.css'
import '@/shared/styles/modals.css'
import '@/shared/styles/forms.css'
import '@/shared/styles/cards.css'
import '@/shared/styles/utilities.css'

interface BuilderProps {
	onBack?: () => void
	project?: Project | null
	onProjectPathChange?: (projectPath: string) => void
	enableAutoProjectSwitch?: boolean
}

export const QuestBuilder: React.FC<BuilderProps> = ({
	onBack,
	project,
	onProjectPathChange,
	enableAutoProjectSwitch = true,
}) => {
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
	const [activeTab, setActiveTab] = useState<string>('locations')
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [unlinkedCount, setUnlinkedCount] = useState<number>(0)
	const currentSaveRef = useRef<Promise<void> | null>(null)
	const [notifications, setNotifications] = useState<
		Array<{ id: string; message: string; type: 'success' | 'error' }>
	>([])
	const [editModal, setEditModal] = useState<{
		isOpen: boolean
		entityType:
			| 'location'
			| 'quest'
			| 'npc'
			| 'item'
			| 'portal'
			| 'dialogue'
			| null
		entity: Location | Quest | NPC | Item | Portal | DialogueSequence | null
	}>({
		isOpen: false,
		entityType: null,
		entity: null,
	})

	const [questAttachmentModal, setQuestAttachmentModal] = useState<{
		isOpen: boolean
		dialogue: DialogueSequence | null
		pendingChanges: {
			questId: string
			stepId: string
			dialogueSequenceId?: string
		}[]
	}>({
		isOpen: false,
		dialogue: null,
		pendingChanges: [],
	})

	const [confirmDialog, setConfirmDialog] = useState<{
		isOpen: boolean
		title: string
		message: string
		onConfirm: () => void
		onCancel: () => void
	}>({
		isOpen: false,
		title: '',
		message: '',
		onConfirm: () => {},
		onCancel: () => {},
	})

	// Load data when component mounts or project changes
	useEffect(() => {
		console.log(
			'Project changed, reloading data. Project:',
			project?.name,
			project?.id
		)
		loadData()
	}, [project?.id])

	// Check if the backend project path matches the current project
	useEffect(() => {
		if (!enableAutoProjectSwitch) return

		const checkProjectPath = async () => {
			if (!onProjectPathChange || !project) return

			try {
				const currentBackendPath = await (
					window as any
				).electronAPI.getQuestEditorProjectPath()
				if (currentBackendPath && currentBackendPath !== project.path) {
					// Find the project that matches the backend path
					const projects = await (window as any).electronAPI.getProjects()
					const matchingProject = projects.find(
						(p: Project) => p.path === currentBackendPath
					)
					if (matchingProject) {
						onProjectPathChange(currentBackendPath)
					}
				}
			} catch (error) {
				console.error('Failed to check project path:', error)
			}
		}

		// Check immediately and then every 5 seconds
		checkProjectPath()
		const interval = setInterval(checkProjectPath, 5000)
		return () => clearInterval(interval)
	}, [project, onProjectPathChange, enableAutoProjectSwitch])

	// Set up window function for unlinked count updates
	useEffect(() => {
		;(window as any).updateUnlinkedCount = (count: number) => {
			setUnlinkedCount(count)
		}
		return () => {
			delete (window as any).updateUnlinkedCount
		}
	}, [])

	const loadData = async () => {
		setLoading(true)
		console.log('Loading data for project:', project?.name, project?.path)

		// Small delay to ensure backend has finished switching projects
		await new Promise((resolve) => setTimeout(resolve, 500))

		const response = await loadGameData()
		console.log('Load response:', response)
		if (response.success && response.data) {
			console.log('Setting game data:', {
				locations: response.data.locations?.length || 0,
				quests: response.data.quests?.length || 0,
				npcs: response.data.npcs?.length || 0,
				items: response.data.items?.length || 0,
				portals: response.data.portals?.length || 0,
				dialogues: response.data.dialogues?.length || 0,
			})
			setGameData(response.data)
		} else {
			console.log('Load failed:', response.error)
		}
		setLoading(false)
	}

	const showNotification = (message: string, type: 'success' | 'error') => {
		const id = generateId()
		setNotifications((prev) => [...prev, { id, message, type }])
	}

	const removeNotification = (id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id))
	}

	const saveData = async (dataToSave?: Game) => {
		const data = dataToSave || gameData

		// If there's already a save in progress, wait for it
		if (currentSaveRef.current) {
			console.log('Save already in progress, waiting...')
			await currentSaveRef.current
		}

		// Create a new save operation
		const saveOperation = (async () => {
			try {
				setSaving(true)
				console.log('Saving data:', data)
				const response = await saveGameData(data)
				console.log('Save response:', response)
				if (response.success) {
					showNotification('Data saved successfully!', 'success')
					// Use the updated data returned from save endpoint instead of reloading
					if (response.data) {
						console.log('Using returned data from save:', response.data)
						setGameData(response.data)
					}
				} else {
					showNotification(
						`Save failed: ${response.error || 'Unknown error'}`,
						'error'
					)
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
		setGameData((prev) => {
			const newData = { ...prev, ...updates }

			// Validate and clean up entity arrays to prevent contamination
			if (newData.items) {
				// Filter out any portals that might have been mixed into items array
				newData.items = newData.items.filter(
					(item: any) => !item.destinationLocationId
				)
			}

			if (newData.portals) {
				// Filter out any items that might have been mixed into portals array
				newData.portals = newData.portals.filter(
					(portal: any) => portal.destinationLocationId
				)
			}

			return newData
		})
	}

	const openEditModal = (
		entityType: 'location' | 'quest' | 'npc' | 'item' | 'portal' | 'dialogue',
		entity: Location | Quest | NPC | Item | Portal | DialogueSequence
	) => {
		setEditModal({
			isOpen: true,
			entityType,
			entity,
		})
	}

	const closeEditModal = () => {
		setEditModal({
			isOpen: false,
			entityType: null,
			entity: null,
		})
	}

	const handleUpdateQuest = (questId: string, updates: Partial<Quest>) => {
		const updatedQuests = (gameData.quests || []).map((quest) =>
			quest.id === questId ? { ...quest, ...updates } : quest
		)
		updateGameData({ quests: updatedQuests })
	}

	const handleUpdateDialogue = (
		dialogueId: string,
		updates: Partial<DialogueSequence>
	) => {
		const updatedDialogues = (gameData.dialogues || []).map((dialogue) =>
			dialogue.id === dialogueId ? { ...dialogue, ...updates } : dialogue
		)
		updateGameData({ dialogues: updatedDialogues })
	}

	const openQuestAttachmentModal = (dialogue: DialogueSequence) => {
		setQuestAttachmentModal({
			isOpen: true,
			dialogue,
			pendingChanges: [],
		})
	}

	const closeQuestAttachmentModal = () => {
		// Save any pending changes before closing (fire-and-forget)
		saveData().catch((error) => {
			console.error('Failed to save quest attachment changes:', error)
		})

		setQuestAttachmentModal({
			isOpen: false,
			dialogue: null,
			pendingChanges: [],
		})
	}

	const handleQuestAttachmentSelect = (questStepId: string) => {
		if (!questAttachmentModal.dialogue) return

		// Update the dialogue to reference this quest step
		handleUpdateDialogue(questAttachmentModal.dialogue.id, {
			questStepId: questStepId,
		})
	}

	const handleQuestAttachmentDeselect = (questStepId: string) => {
		if (!questAttachmentModal.dialogue) return

		// Remove the quest step reference from this dialogue
		handleUpdateDialogue(questAttachmentModal.dialogue.id, {
			questStepId: null,
		})
	}

	const handleQuestAttachmentDetach = (
		questStepId: string,
		dialogueId: string
	) => {
		// Remove the quest step reference from this dialogue
		handleUpdateDialogue(dialogueId, {
			questStepId: null,
		})
	}

	const saveEditedEntity = async (
		updatedEntity: Location | Quest | NPC | Item | Portal | DialogueSequence
	) => {
		if (!editModal.entityType || !editModal.entity) return

		let updatedGameData: Game

		// Check if this is a new entity (doesn't exist in current game data) or an existing one
		const originalEntity = editModal.entity
		const isNewEntity = (() => {
			switch (editModal.entityType) {
				case 'location':
					return !gameData.locations.some((loc) => loc.id === originalEntity.id)
				case 'quest':
					return !gameData.quests.some(
						(quest) => quest.id === originalEntity.id
					)
				case 'npc':
					const npcs = (gameData as any).npcs || []
					return !npcs.some((npc: NPC) => npc.id === originalEntity.id)
				case 'item':
					const items = (gameData as any).items || []
					return !items.some((item: Item) => item.id === originalEntity.id)
				case 'portal':
					const portals = (gameData as any).portals || []
					return !portals.some(
						(portal: Portal) => portal.id === originalEntity.id
					)
				case 'dialogue':
					return !(gameData.dialogues || []).some(
						(dialogue: DialogueSequence) => dialogue.id === originalEntity.id
					)
				default:
					return false
			}
		})()

		switch (editModal.entityType) {
			case 'location':
				// Auto-generate onInteract actions for portals within the location
				const locationWithUpdatedPortals = {
					...(updatedEntity as Location),
					portals: (updatedEntity as Location).portals.map((portal) => ({
						...portal,
						onInteract: portal.destinationLocationId
							? [
									{
										type: ActionType.ChangeLocation,
										params: {
											locationId: portal.destinationLocationId,
										},
									},
							  ]
							: [],
					})),
				}

				if (isNewEntity) {
					updatedGameData = {
						...gameData,
						locations: [...gameData.locations, locationWithUpdatedPortals],
					}
				} else {
					updatedGameData = {
						...gameData,
						locations: gameData.locations.map((loc) =>
							loc.id === originalEntity.id ? locationWithUpdatedPortals : loc
						),
					}
				}
				break
			case 'quest':
				if (isNewEntity) {
					updatedGameData = {
						...gameData,
						quests: [...gameData.quests, updatedEntity as Quest],
					}
				} else {
					updatedGameData = {
						...gameData,
						quests: gameData.quests.map((quest) =>
							quest.id === originalEntity.id ? (updatedEntity as Quest) : quest
						),
					}
				}
				break
			case 'npc':
				const npcs = (gameData as any).npcs || []
				if (isNewEntity) {
					updatedGameData = {
						...gameData,
						npcs: [...npcs, updatedEntity as NPC],
					}
				} else {
					updatedGameData = {
						...gameData,
						npcs: npcs.map((npc: NPC) =>
							npc.id === originalEntity.id ? (updatedEntity as NPC) : npc
						),
					}
				}
				break
			case 'item':
				const items = (gameData as any).items || []
				if (isNewEntity) {
					updatedGameData = {
						...gameData,
						items: [...items, updatedEntity as Item],
					}
				} else {
					updatedGameData = {
						...gameData,
						items: items.map((item: Item) =>
							item.id === originalEntity.id ? (updatedEntity as Item) : item
						),
					}
				}
				break
			case 'portal':
				const portals = (gameData as any).portals || []
				// Auto-generate onInteract actions for portals
				const portalWithActions = {
					...(updatedEntity as Portal),
					onInteract: (updatedEntity as Portal).destinationLocationId
						? [
								{
									type: ActionType.ChangeLocation,
									params: {
										locationId: (updatedEntity as Portal).destinationLocationId,
									},
								},
						  ]
						: [],
				}

				if (isNewEntity) {
					updatedGameData = {
						...gameData,
						portals: [...portals, portalWithActions],
					}
				} else {
					updatedGameData = {
						...gameData,
						portals: portals.map((portal: Portal) =>
							portal.id === originalEntity.id ? portalWithActions : portal
						),
					}
				}
				break
			case 'dialogue':
				if (isNewEntity) {
					updatedGameData = {
						...gameData,
						dialogues: [
							...(gameData.dialogues || []),
							updatedEntity as DialogueSequence,
						],
					}
				} else {
					updatedGameData = {
						...gameData,
						dialogues: (gameData.dialogues || []).map(
							(dialogue: DialogueSequence) =>
								dialogue.id === originalEntity.id
									? (updatedEntity as DialogueSequence)
									: dialogue
						),
					}
				}
				break
		}

		// If the entity ID changed, update all references to it
		const entityIdChanged = updatedEntity.id !== originalEntity.id
		if (entityIdChanged) {
			console.log(
				`Entity ID changed from ${originalEntity.id} to ${updatedEntity.id} for ${editModal.entityType}`
			)
			updatedGameData = updateEntityReferences(
				updatedGameData,
				editModal.entityType,
				originalEntity.id,
				updatedEntity.id
			)
		}

		// Update local state and save
		setGameData(updatedGameData)
		await saveData(updatedGameData)
		closeEditModal()
	}

	// Update all references to an entity when its ID changes
	const updateEntityReferences = (
		gameData: Game,
		entityType: string,
		oldId: string,
		newId: string
	): Game => {
		const updatedData = JSON.parse(JSON.stringify(gameData)) // Deep clone

		// Update references in locations
		updatedData.locations.forEach((location: any) => {
			// Update item references in location arrays
			if (entityType === 'item') {
				location.items = location.items.map((item: any) =>
					item.id === oldId ? { ...item, id: newId } : item
				)
			}

			// Update NPC references in location arrays
			if (entityType === 'npc') {
				location.npcs = location.npcs.map((npc: any) =>
					npc.id === oldId ? { ...npc, id: newId } : npc
				)
			}

			// Update portal references in location arrays
			if (entityType === 'portal') {
				location.portals = location.portals.map((portal: any) =>
					portal.id === oldId ? { ...portal, id: newId } : portal
				)
			}

			// Update item references in onInteract actions
			location.items.forEach((item: any) => {
				if (item.onInteract) {
					item.onInteract.forEach((action: any) => {
						if (action.params && action.params.entityId === oldId) {
							action.params.entityId = newId
						}
						if (action.params && action.params.itemName === oldId) {
							action.params.itemName = newId
						}
					})
				}
			})

			// Update NPC references in onInteract actions
			location.npcs.forEach((npc: any) => {
				if (npc.onInteract) {
					npc.onInteract.forEach((action: any) => {
						if (action.params && action.params.entityId === oldId) {
							action.params.entityId = newId
						}
						if (action.params && action.params.npcId === oldId) {
							action.params.npcId = newId
						}
					})
				}
			})

			// Update portal references in onInteract actions
			location.portals.forEach((portal: any) => {
				if (portal.onInteract) {
					portal.onInteract.forEach((action: any) => {
						if (action.params && action.params.portalId === oldId) {
							action.params.portalId = newId
						}
						if (action.params && action.params.locationId === oldId) {
							action.params.locationId = newId
						}
					})
				}
				if (portal.destinationLocationId === oldId) {
					portal.destinationLocationId = newId
				}
			})
		})

		// Update quest references
		updatedData.quests.forEach((quest: any) => {
			quest.steps.forEach((step: any) => {
				if (step.onStart) {
					step.onStart.forEach((action: any) => {
						if (action.params) {
							if (action.params.entityId === oldId)
								action.params.entityId = newId
							if (action.params.itemName === oldId)
								action.params.itemName = newId
							if (action.params.npcId === oldId) action.params.npcId = newId
							if (action.params.portalId === oldId)
								action.params.portalId = newId
							if (action.params.locationId === oldId)
								action.params.locationId = newId
							if (action.params.questId === oldId) action.params.questId = newId
						}
					})
				}
				if (step.onComplete) {
					step.onComplete.forEach((action: any) => {
						if (action.params) {
							if (action.params.entityId === oldId)
								action.params.entityId = newId
							if (action.params.itemName === oldId)
								action.params.itemName = newId
							if (action.params.npcId === oldId) action.params.npcId = newId
							if (action.params.portalId === oldId)
								action.params.portalId = newId
							if (action.params.locationId === oldId)
								action.params.locationId = newId
							if (action.params.questId === oldId) action.params.questId = newId
						}
					})
				}
				if (step.objectiveParams) {
					if (step.objectiveParams.npcId === oldId)
						step.objectiveParams.npcId = newId
					if (step.objectiveParams.itemName === oldId)
						step.objectiveParams.itemName = newId
					if (step.objectiveParams.portalId === oldId)
						step.objectiveParams.portalId = newId
				}
			})
		})

		// Update dialogue npcId references
		if (entityType === 'npc') {
			updatedData.dialogues.forEach((dialogue: any) => {
				if (dialogue.npcId === oldId) {
					dialogue.npcId = newId
				}
			})
		}

		// Update dialogue sequence references in NPCs
		if (entityType === 'dialogue') {
			updatedData.npcs.forEach((npc: any) => {
				if (npc.dialogueSequences) {
					npc.dialogueSequences = npc.dialogueSequences.map(
						(dialogueId: string) => (dialogueId === oldId ? newId : dialogueId)
					)
				}
			})
		}

		// Update quest step references
		if (entityType === 'quest-step') {
			// Update activeStepId in quests
			updatedData.quests.forEach((quest: any) => {
				if (quest.activeStepId === oldId) {
					quest.activeStepId = newId
				}
			})

			// Update questStepId in dialogue sequences
			updatedData.dialogues.forEach((dialogue: any) => {
				if (dialogue.questStepId === oldId) {
					dialogue.questStepId = newId
				}
			})
		}

		return updatedData
	}

	const addLocation = () => {
		const newLocation: Location = {
			id: generateId(),
			name: 'New Location',
			backgroundMusic: '',
			image: '',
			items: [],
			npcs: [],
			portals: [],
		}
		openEditModal('location', newLocation)
	}

	const addQuest = () => {
		const newQuest: Quest = {
			id: generateId(),
			chapter: 'Chapter 1',
			title: 'New Quest',
			description: 'Quest description',
			order: gameData.quests.length,
			steps: [],
			completed: false,
		}
		openEditModal('quest', newQuest)
	}

	const addNPC = () => {
		const newNPC: NPC = {
			id: generateId(),
			name: 'New NPC',
			image: '',
			state: EntityState.World,
		}
		openEditModal('npc', newNPC)
	}

	const addItem = () => {
		const newItem: Item = {
			id: generateId(),
			name: 'New Item',
			image: '',
			state: EntityState.World,
			interactive: InteractiveMode.Grabbable,
			onInteract: [],
		}
		openEditModal('item', newItem)
	}

	const addPortal = () => {
		const newPortal: Portal = {
			id: generateId(),
			name: 'New Portal',
			image: '',
			state: EntityState.World,
			interactive: InteractiveMode.Interactive,
			onInteract: [],
			destinationLocationId: '',
		}
		openEditModal('portal', newPortal)
	}

	const addDialogue = () => {
		const newDialogue: DialogueSequence = {
			id: generateId(),
			name: 'New Dialogue Sequence',
			dialogs: [],
		}
		openEditModal('dialogue', newDialogue)
	}

	const deleteLocation = (location: Location) => {
		setConfirmDialog({
			isOpen: true,
			title: '⚠️ CRITICAL DELETION PROTOCOL ⚠️',
			message: `WARNING: Deleting location "${location.name}" will permanently remove it and all associated data. This action cannot be undone. Proceed with extreme caution.`,
			onConfirm: async () => {
				console.log('Deleting location:', location.name)
				const updatedGameData = {
					...gameData,
					locations: gameData.locations.filter((l) => l.id !== location.id),
				}
				setGameData(updatedGameData)
				console.log('Updated gameData, calling saveData')
				await saveData(updatedGameData)
				console.log('Save completed, closing dialog')
				setConfirmDialog({
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
					onCancel: () => {},
				})
			},
			onCancel: () =>
				setConfirmDialog({
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
					onCancel: () => {},
				}),
		})
	}

	const deleteQuest = (quest: Quest) => {
		setConfirmDialog({
			isOpen: true,
			title: '⚠️ MISSION TERMINATION ⚠️',
			message: `DANGER: Terminating quest "${quest.title}" will erase all quest progress and objectives. This mission will be lost forever. Confirm termination?`,
			onConfirm: async () => {
				const updatedGameData = {
					...gameData,
					quests: gameData.quests.filter((q) => q.id !== quest.id),
				}
				setGameData(updatedGameData)
				await saveData(updatedGameData)
				setConfirmDialog({
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
					onCancel: () => {},
				})
			},
			onCancel: () =>
				setConfirmDialog({
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
					onCancel: () => {},
				}),
		})
	}

	const deleteNPC = (npc: NPC) => {
		setConfirmDialog({
			isOpen: true,
			title: '⚠️ ENTITY PURGE PROTOCOL ⚠️',
			message: `CRITICAL ALERT: NPC "${npc.name}" will be permanently eliminated from the system. All dialogue sequences and interactions will be lost. This cannot be reversed.`,
			onConfirm: async () => {
				const updatedGameData = {
					...gameData,
					npcs: [
						...((gameData as any).npcs || []).filter(
							(n: NPC) => n.id !== npc.id
						),
					],
				}
				setGameData(updatedGameData)
				await saveData(updatedGameData)
				setConfirmDialog({
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
					onCancel: () => {},
				})
			},
			onCancel: () =>
				setConfirmDialog({
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
					onCancel: () => {},
				}),
		})
	}

	const deleteItem = (item: Item) => {
		setConfirmDialog({
			isOpen: true,
			title: '⚠️ INVENTORY DESTRUCTION ⚠️',
			message: `DESTRUCTION ALERT: Item "${item.name}" will be vaporized from the inventory database. All item properties and interactions will be permanently erased.`,
			onConfirm: async () => {
				const updatedGameData = {
					...gameData,
					items: [
						...((gameData as any).items || []).filter(
							(i: Item) => i.id !== item.id
						),
					],
				}
				setGameData(updatedGameData)
				await saveData(updatedGameData)
				setConfirmDialog({
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
					onCancel: () => {},
				})
			},
			onCancel: () =>
				setConfirmDialog({
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
					onCancel: () => {},
				}),
		})
	}

	const deletePortal = (portal: Portal) => {
		setConfirmDialog({
			isOpen: true,
			title: '⚠️ PORTAL COLLAPSE ⚠️',
			message: `DIMENSIONAL ALERT: Portal "${portal.name}" will collapse, severing all dimensional connections. Travel routes will be permanently disrupted.`,
			onConfirm: async () => {
				const updatedGameData = {
					...gameData,
					portals: [
						...((gameData as any).portals || []).filter(
							(p: Portal) => p.id !== portal.id
						),
					],
				}
				setGameData(updatedGameData)
				await saveData(updatedGameData)
				setConfirmDialog({
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
					onCancel: () => {},
				})
			},
			onCancel: () =>
				setConfirmDialog({
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
					onCancel: () => {},
				}),
		})
	}

	const deleteDialogue = (dialogue: DialogueSequence) => {
		setConfirmDialog({
			isOpen: true,
			title: '⚠️ DIALOGUE DELETION ⚠️',
			message: `CRITICAL ALERT: Dialogue sequence "${dialogue.name}" will be permanently eliminated from the system. Any NPCs referencing this dialogue will lose their dialogue sequences. This cannot be reversed.`,
			onConfirm: async () => {
				const updatedGameData = {
					...gameData,
					dialogues: (gameData.dialogues || []).filter(
						(d: DialogueSequence) => d.id !== dialogue.id
					),
				}
				await saveData(updatedGameData)
				setConfirmDialog({
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
					onCancel: () => {},
				})
			},
			onCancel: () =>
				setConfirmDialog({
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
					onCancel: () => {},
				}),
		})
	}

	if (loading) {
		return <div className='loading'>Loading...</div>
	}

	return (
		<div className='builder'>
			<BuilderHeader
				loading={loading}
				onReload={loadData}
				onBack={onBack}
				projectName={project?.name}
			/>

			<BuilderTabs
				activeTab={activeTab}
				gameData={gameData}
				onTabChange={setActiveTab}
				unlinkedCount={unlinkedCount}
			/>

			<div className='builder-content'>
				{activeTab === 'locations' && (
					<LocationPanel
						locations={gameData.locations}
						onAdd={addLocation}
						onEdit={(location: Location) => {
							openEditModal('location', location)
						}}
						onDelete={deleteLocation}
					/>
				)}

				{activeTab === 'quests' && (
					<QuestPanel
						quests={gameData.quests}
						onAdd={addQuest}
						onEdit={(quest: Quest) => {
							openEditModal('quest', quest)
						}}
						onDelete={deleteQuest}
					/>
				)}

				{activeTab === 'npcs' && (
					<NPCPanel
						npcs={(gameData as any).npcs || []}
						onAdd={addNPC}
						onEdit={(npc: NPC) => {
							openEditModal('npc', npc)
						}}
						onDelete={deleteNPC}
					/>
				)}

				{activeTab === 'items' && (
					<ItemPanel
						items={(gameData as any).items || []}
						onAdd={addItem}
						onEdit={(item: Item) => {
							openEditModal('item', item)
						}}
						onDelete={deleteItem}
					/>
				)}

				{activeTab === 'portals' && (
					<PortalPanel
						portals={(gameData as any).portals || []}
						onAdd={addPortal}
						onEdit={(portal: Portal) => {
							openEditModal('portal', portal)
						}}
						onDelete={deletePortal}
					/>
				)}

				{activeTab === 'dialogues' && (
					<DialoguePanel
						dialogues={gameData.dialogues || []}
						npcs={(gameData as any).npcs || []}
						quests={gameData.quests || []}
						onAdd={addDialogue}
						onEdit={(dialogue) => openEditModal('dialogue', dialogue)}
						onDelete={deleteDialogue}
						onAttachQuestSteps={openQuestAttachmentModal}
					/>
				)}

				{activeTab === 'links' && <LinksPanel gameData={gameData} />}
			</div>

			<NotificationContainer
				notifications={notifications}
				onRemove={removeNotification}
			/>

			<EditModal
				isOpen={editModal.isOpen}
				entityType={editModal.entityType || 'location'}
				entity={editModal.entity}
				onSave={saveEditedEntity}
				onClose={closeEditModal}
				onUpdateQuest={handleUpdateQuest}
				onSaveDialogue={(dialogue) =>
					handleUpdateDialogue(dialogue.id, dialogue)
				}
				availableItems={(gameData as any).items || []}
				availableLocations={gameData.locations}
				availablePortals={(gameData as any).portals || []}
				availableNpcs={(gameData as any).npcs || []}
				availableQuests={gameData.quests || []}
				availableDialogues={gameData.dialogues || []}
			/>

			{/* Quest Attachment Modal */}
			{questAttachmentModal.isOpen && questAttachmentModal.dialogue && (
				<QuestStepSelector
					availableQuests={gameData.quests || []}
					availableQuestSteps={(gameData.quests || []).flatMap((quest) =>
						quest.steps.map((step) => ({ ...step, questId: quest.id }))
					)}
					availableDialogues={gameData.dialogues || []}
					availableNpcs={gameData.npcs || []}
					selectedQuestStepIds={
						questAttachmentModal.dialogue!.questStepId
							? [questAttachmentModal.dialogue!.questStepId]
							: []
					}
					onSelectQuestStep={handleQuestAttachmentSelect}
					onDeselectQuestStep={handleQuestAttachmentDeselect}
					onDetachQuestStep={handleQuestAttachmentDetach}
					onClose={closeQuestAttachmentModal}
					dialogueNpcId={questAttachmentModal.dialogue.npcId}
					dialogueId={questAttachmentModal.dialogue.id}
				/>
			)}

			{/* Custom Confirmation Dialog */}
			{confirmDialog.isOpen && (
				<div
					className='modal-overlay'
					onClick={() =>
						setConfirmDialog({
							isOpen: false,
							title: '',
							message: '',
							onConfirm: () => {},
							onCancel: () => {},
						})
					}
				>
					<div className='confirm-dialog' onClick={(e) => e.stopPropagation()}>
						<div className='confirm-header'>
							<h2 className='danger-title'>{confirmDialog.title}</h2>
						</div>
						<div className='confirm-body'>
							<div className='warning-icon'>⚠️</div>
							<p className='danger-message'>{confirmDialog.message}</p>
						</div>
						<div className='confirm-footer'>
							<button
								className='confirm-button cancel'
								onClick={confirmDialog.onCancel}
							>
								ABORT
							</button>
							<button
								className='confirm-button danger-confirm'
								onClick={confirmDialog.onConfirm}
							>
								CONFIRM DESTRUCTION
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
