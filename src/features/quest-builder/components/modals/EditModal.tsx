import React, { useState, useEffect } from 'react'
import {
	Location,
	Quest,
	NPC,
	Item,
	Portal,
	DialogueSequence,
	Dialog,
	Button,
	EntityState,
	InteractiveMode,
} from '@/core/models/types'
import { generateIdFromApi } from '@/shared/utils/api'
import {
	EntityType,
	ItemSelectorState,
	DialogueEditorState,
} from '@/features/quest-builder/types'
import { LocationEditForm } from './LocationEditForm'
import { QuestEditForm } from './QuestEditForm'
import { NPCEditForm } from './NPCEditForm'
import { ItemEditForm } from './ItemEditForm'
import { PortalEditForm } from './PortalEditForm'
import { ItemSelector } from '../dialogs/ItemSelector'
import { DialogueEditor } from '../dialogs/DialogueEditor'
import { UniversalSelector } from '../../../../shared/components/ui/UniversalSelector'

interface EditModalProps {
	isOpen: boolean
	entityType: EntityType
	entity: Location | Quest | NPC | Item | Portal | null
	onSave: (entity: Location | Quest | NPC | Item | Portal) => void
	onClose: () => void
	availableItems: Item[]
	availableLocations?: Location[]
	availablePortals?: Portal[]
	availableNpcs?: NPC[]
	availableQuests?: Quest[]
	availableDialogues?: DialogueSequence[]
}

export const EditModal: React.FC<EditModalProps> = ({
	isOpen,
	entityType,
	entity,
	onSave,
	onClose,
	availableItems = [],
	availableLocations = [],
	availablePortals = [],
	availableNpcs = [],
	availableQuests = [],
	availableDialogues = [],
}) => {
	const [formData, setFormData] = useState<
		Location | Quest | NPC | Item | Portal | null
	>(null)
	const [dialogueEditor, setDialogueEditor] = useState<DialogueEditorState>({
		isOpen: false,
		sequenceIndex: null,
		sequence: null,
	})

	const [itemSelector, setItemSelector] = useState<ItemSelectorState>({
		isOpen: false,
		availableItems: [],
		hoveredItem: null,
		mousePosition: { x: 0, y: 0 },
		selectedItems: [],
		isShiftPressed: false,
	})

	const [locationSelectorOpen, setLocationSelectorOpen] = useState(false)

	useEffect(() => {
		if (entity) {
			setFormData(JSON.parse(JSON.stringify(entity))) // Deep copy
		} else {
			setFormData(null)
		}
	}, [entity])

	// Handle shift key for multi-selection
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Shift') {
				setItemSelector((prev) => ({ ...prev, isShiftPressed: true }))
			}
		}

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === 'Shift') {
				setItemSelector((prev) => {
					if (prev.selectedItems.length > 0) {
						// Add all selected items to the location
						addMultipleItemsToLocation(prev.selectedItems)
						// Close the modal after adding items
						setTimeout(() => closeItemSelector(), 100)
						return {
							...prev,
							selectedItems: [],
							isShiftPressed: false,
							isOpen: false,
						}
					}
					return {
						...prev,
						isShiftPressed: false,
					}
				})
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		window.addEventListener('keyup', handleKeyUp)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('keyup', handleKeyUp)
		}
	}, [entityType, formData])

	// Auto-generate ID when name changes (for NPCs, items, portals)
	useEffect(() => {
		if (
			formData &&
			(entityType === 'npc' || entityType === 'item' || entityType === 'portal')
		) {
			const nameField = 'name'
			const currentId = formData.id
			const name = (formData as any).name

			if (!name) return

			// Debounce the API call
			const timeoutId = setTimeout(async () => {
				try {
					const response = await generateIdFromApi(name, entityType, currentId)
					if (
						response.success &&
						response.data?.id &&
						response.data.id !== currentId
					) {
						updateFormData({ id: response.data.id })
					}
				} catch (error) {
					console.error('Failed to generate ID:', error)
				}
			}, 300) // 300ms debounce

			return () => clearTimeout(timeoutId)
		}
	}, [(formData as any)?.name, entityType, formData?.id])

	// Auto-generate ID when title changes (for quests)
	useEffect(() => {
		if (formData && entityType === 'quest' && (formData as Quest).title) {
			const title = (formData as Quest).title
			const currentId = formData.id

			// Debounce the API call
			const timeoutId = setTimeout(async () => {
				try {
					const response = await generateIdFromApi(title, 'quest', currentId)
					if (
						response.success &&
						response.data?.id &&
						response.data.id !== currentId
					) {
						updateFormData({ id: response.data.id })
					}
				} catch (error) {
					console.error('Failed to generate ID:', error)
				}
			}, 300) // 300ms debounce

			return () => clearTimeout(timeoutId)
		}
	}, [(formData as Quest)?.title, entityType, formData?.id])

	// Auto-generate ID when location name changes
	useEffect(() => {
		if (formData && entityType === 'location') {
			const name = (formData as Location).name
			const currentId = formData.id

			if (!name) return

			// Debounce the API call
			const timeoutId = setTimeout(async () => {
				try {
					const response = await generateIdFromApi(name, 'location', currentId)
					if (
						response.success &&
						response.data?.id &&
						response.data.id !== currentId
					) {
						updateFormData({ id: response.data.id })
					}
				} catch (error) {
					console.error('Failed to generate ID:', error)
				}
			}, 300) // 300ms debounce

			return () => clearTimeout(timeoutId)
		}
	}, [(formData as Location)?.name, entityType, formData?.id])

	if (!isOpen || !entity || !formData) return null

	const handleSave = async () => {
		if (formData) {
			await onSave(formData)
			onClose()
		}
	}

	const updateFormData = (
		updates: Partial<Location | Quest | NPC | Item | Portal>
	) => {
		setFormData((prev) => (prev ? { ...prev, ...updates } : null))
	}

	const saveDialogueSequence = (updatedSequence: DialogueSequence) => {
		if (dialogueEditor.sequenceIndex === null) return

		updateFormData(updatedSequence)
		setDialogueEditor({ isOpen: false, sequenceIndex: null, sequence: null })
	}

	const closeDialogueEditor = () => {
		setDialogueEditor({ isOpen: false, sequenceIndex: null, sequence: null })
	}

	// Item selector management functions
	const openItemSelector = () => {
		if (entityType !== 'location' || !formData) return

		const location = formData as Location
		const existingItemIds = location.items.map((item) => item.id)

		// Filter out items that are already in the location
		const filteredItems = availableItems.filter(
			(item) => !existingItemIds.includes(item.id)
		)

		setItemSelector({
			isOpen: true,
			availableItems: filteredItems,
			hoveredItem: null,
			mousePosition: { x: 0, y: 0 },
			selectedItems: [],
			isShiftPressed: false,
		})
	}

	const closeItemSelector = () => {
		setItemSelector({
			isOpen: false,
			availableItems: [],
			hoveredItem: null,
			mousePosition: { x: 0, y: 0 },
			selectedItems: [],
			isShiftPressed: false,
		})
	}

	const selectItem = (item: Item) => {
		if (!formData || entityType !== 'location') return

		const location = formData as Location
		// Check if item is already in the location
		const itemExists = location.items.some(
			(existingItem) => existingItem.id === item.id
		)

		if (!itemExists) {
			// Add the item to the location with default properties
			const newItemData = {
				id: item.id,
				name: item.name,
				image: item.image,
				audioOnInteraction: item.audio || '',
				audioOnGrab: '',
				state: EntityState.World,
				interactive: item.interactive,
				onInteract: item.onInteract || [],
			}

			const newItems = [...location.items, newItemData]
			updateFormData({ items: newItems })
		}

		closeItemSelector()
	}

	const addMultipleItemsToLocation = (items: Item[]) => {
		if (!formData || entityType !== 'location') return

		const location = formData as Location
		const newItems = [...location.items]

		items.forEach((item) => {
			// Check if item is already in the location
			const itemExists = newItems.some(
				(existingItem) => existingItem.id === item.id
			)

			if (!itemExists) {
				// Add the item to the location with default properties
				const newItemData = {
					id: item.id,
					name: item.name,
					image: item.image,
					audioOnInteraction: item.audio || '',
					audioOnGrab: '',
					state: EntityState.World,
					interactive: item.interactive,
					onInteract: item.onInteract || [],
				}

				newItems.push(newItemData)
			}
		})

		updateFormData({ items: newItems })
	}

	const handleItemMouseEnter = (item: Item, e: React.MouseEvent) => {
		setItemSelector((prev) => ({
			...prev,
			hoveredItem: item,
			mousePosition: { x: e.clientX, y: e.clientY },
		}))
	}

	const handleItemMouseLeave = () => {
		setItemSelector((prev) => ({
			...prev,
			hoveredItem: null,
		}))
	}

	// Location selector management functions
	const openLocationSelector = () => {
		setLocationSelectorOpen(true)
	}

	const closeLocationSelector = () => {
		setLocationSelectorOpen(false)
	}

	const selectLocation = (location: Location) => {
		if (!formData || entityType !== 'portal') return

		updateFormData({ destinationLocationId: location.id })
		closeLocationSelector()
	}

	const updateDialogueSequence = (updates: Partial<DialogueSequence>) => {
		setDialogueEditor((prev) => ({
			...prev,
			sequence: prev.sequence ? { ...prev.sequence, ...updates } : null,
		}))
	}

	const addDialog = () => {
		if (!dialogueEditor.sequence) return

		const newDialog: Dialog = {
			id: `dialog_${Date.now()}`,
			text: 'New dialog text',
			isQuestion: false,
			isEndOfDialog: false,
		}
		const updatedDialogs = [...dialogueEditor.sequence.dialogs, newDialog]
		updateDialogueSequence({ dialogs: updatedDialogs })
	}

	const updateDialog = (index: number, updates: Partial<Dialog>) => {
		if (!dialogueEditor.sequence) return

		const updatedDialogs = [...dialogueEditor.sequence.dialogs]
		updatedDialogs[index] = { ...updatedDialogs[index], ...updates }
		updateDialogueSequence({ dialogs: updatedDialogs })
	}

	const removeDialog = (index: number) => {
		if (!dialogueEditor.sequence) return

		const updatedDialogs = dialogueEditor.sequence.dialogs.filter(
			(_: Dialog, i: number) => i !== index
		)
		updateDialogueSequence({ dialogs: updatedDialogs })
	}

	const addButton = (dialogIndex: number) => {
		if (!dialogueEditor.sequence) return

		const dialog = dialogueEditor.sequence.dialogs[dialogIndex]
		const newButton: Button = {
			label: 'New Option',
			goToDialog: dialogIndex, // Default to self, user can change
			size: 300,
		}
		const updatedButtons = [...(dialog.buttons || []), newButton]
		updateDialog(dialogIndex, { buttons: updatedButtons })
	}

	const updateButton = (
		dialogIndex: number,
		buttonIndex: number,
		updates: Partial<Button>
	) => {
		if (!dialogueEditor.sequence) return

		const dialog = dialogueEditor.sequence.dialogs[dialogIndex]
		const updatedButtons = [...(dialog.buttons || [])]
		updatedButtons[buttonIndex] = { ...updatedButtons[buttonIndex], ...updates }
		updateDialog(dialogIndex, { buttons: updatedButtons })
	}

	const removeButton = (dialogIndex: number, buttonIndex: number) => {
		if (!dialogueEditor.sequence) return

		const dialog = dialogueEditor.sequence.dialogs[dialogIndex]
		const updatedButtons = (dialog.buttons || []).filter(
			(_: Button, i: number) => i !== buttonIndex
		)
		updateDialog(dialogIndex, { buttons: updatedButtons })
	}

	return (
		<>
			<div className='modal-overlay' onClick={onClose}>
				<div
					className='modal-content edit-modal'
					onClick={(e) => e.stopPropagation()}
				>
					<div className='modal-header'>
						<h2>
							Edit {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
						</h2>
						<button className='modal-close' onClick={onClose}>
							&times;
						</button>
					</div>
					<div className='modal-body'>
						{entityType === 'location' && (
							<LocationEditForm
								location={formData as Location}
								onUpdate={updateFormData}
								onOpenItemSelector={openItemSelector}
								onOpenNpcSelector={() => {}}
								onOpenPortalSelector={() => {}}
								onOpenLocationSelector={openLocationSelector}
								availableItems={availableItems}
								availableLocations={availableLocations}
							/>
						)}
						{entityType === 'quest' && (
							<QuestEditForm
								quest={formData as Quest}
								onUpdate={updateFormData}
								npcs={availableNpcs}
								items={availableItems}
								locations={availableLocations}
								quests={availableQuests}
								dialogues={availableDialogues}
								portals={availablePortals}
							/>
						)}
						{entityType === 'npc' && (
							<NPCEditForm npc={formData as NPC} onUpdate={updateFormData} />
						)}
						{entityType === 'item' && (
							<ItemEditForm item={formData as Item} onUpdate={updateFormData} />
						)}
						{entityType === 'portal' && (
							<PortalEditForm
								portal={formData as Portal}
								onUpdate={updateFormData}
								onOpenLocationSelector={openLocationSelector}
								availableLocations={availableLocations}
							/>
						)}
					</div>
					<div className='modal-footer'>
						<button className='cancel-button' onClick={onClose}>
							Cancel
						</button>
						<button className='save-button' onClick={handleSave}>
							Save
						</button>
					</div>
				</div>
			</div>

			<DialogueEditor
				dialogueEditor={dialogueEditor}
				onClose={closeDialogueEditor}
				onUpdateSequence={updateDialogueSequence}
				onAddDialog={addDialog}
				onUpdateDialog={updateDialog}
				onRemoveDialog={removeDialog}
				onAddButton={addButton}
				onUpdateButton={updateButton}
				onRemoveButton={removeButton}
			/>

			<ItemSelector
				itemSelector={itemSelector}
				onClose={closeItemSelector}
				onSelectItem={selectItem}
				onMouseEnter={handleItemMouseEnter}
				onMouseLeave={handleItemMouseLeave}
			/>

			<UniversalSelector
				isOpen={locationSelectorOpen}
				title='Select Destination Location'
				items={availableLocations}
				onSelect={selectLocation}
				onClose={closeLocationSelector}
				emptyMessage='No locations available.'
			/>
		</>
	)
}
