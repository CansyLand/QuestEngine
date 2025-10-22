import React, { useState, useEffect } from 'react'
import {
	Location,
	Quest,
	NPC,
	Item,
	Portal,
	InteractiveMode,
	Action,
	DialogueSequence,
	QuestStep,
	Dialog,
	Button,
	EntityState,
} from '@/core/models/types'
import { generateIdFromApi } from '@/shared/utils/api'
import { LocationEditForm } from './modals/LocationEditForm'
import { QuestEditForm } from './modals/QuestEditForm'
import { NPCEditForm } from './modals/NPCEditForm'
import { ItemEditForm } from './modals/ItemEditForm'
import { PortalEditForm } from './modals/PortalEditForm'
import {
	EntityTooltip,
	TooltipEntity,
} from '@/shared/components/ui/EntityTooltip'
import { DialogueEditForm } from './modals/DialogueEditForm'

interface LocationSelectorState {
	isOpen: boolean
	availableLocations: Location[]
	hoveredLocation: Location | null
	mousePosition: { x: number; y: number }
	selectedLocation: Location | null
}

type EntityType = 'location' | 'quest' | 'npc' | 'item' | 'portal' | 'dialogue'
type Entity = Location | Quest | NPC | Item | Portal | DialogueSequence

interface EditModalProps {
	isOpen: boolean
	entityType: EntityType
	entity: Entity | null
	onSave: (entity: Entity) => void
	onClose: () => void
	onUpdateQuest?: (questId: string, updates: Partial<Quest>) => void
	onSaveDialogue?: (dialogue: DialogueSequence) => void
	availableItems?: Item[]
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
	onUpdateQuest,
	onSaveDialogue,
	availableItems = [],
	availableLocations = [],
	availablePortals = [],
	availableNpcs = [],
	availableQuests = [],
	availableDialogues = [],
}) => {
	const [formData, setFormData] = useState<Entity | null>(null)
	const [dialogueEditor, setDialogueEditor] = useState<{
		isOpen: boolean
		sequenceIndex: number | null
		sequence: DialogueSequence | null
	}>({
		isOpen: false,
		sequenceIndex: null,
		sequence: null,
	})

	const [itemSelector, setItemSelector] = useState<{
		isOpen: boolean
		availableItems: Item[]
		hoveredItem: Item | null
		mousePosition: { x: number; y: number }
		selectedItems: Item[]
		isShiftPressed: boolean
	}>({
		isOpen: false,
		availableItems: [],
		hoveredItem: null,
		mousePosition: { x: 0, y: 0 },
		selectedItems: [],
		isShiftPressed: false,
	})

	// Unified tooltip state
	const [unifiedTooltip, setUnifiedTooltip] = useState<{
		entity: TooltipEntity | null
		position: { x: number; y: number } | null
	}>({
		entity: null,
		position: null,
	})

	const [portalSelector, setPortalSelector] = useState<{
		isOpen: boolean
		availablePortals: Portal[]
		hoveredPortal: Portal | null
		mousePosition: { x: number; y: number }
		selectedPortals: Portal[]
		isShiftPressed: boolean
	}>({
		isOpen: false,
		availablePortals: [],
		hoveredPortal: null,
		mousePosition: { x: 0, y: 0 },
		selectedPortals: [],
		isShiftPressed: false,
	})

	const [npcSelector, setNpcSelector] = useState<{
		isOpen: boolean
		availableNpcs: NPC[]
		hoveredNpc: NPC | null
		mousePosition: { x: number; y: number }
		selectedNpcs: NPC[]
		isShiftPressed: boolean
	}>({
		isOpen: false,
		availableNpcs: [],
		hoveredNpc: null,
		mousePosition: { x: 0, y: 0 },
		selectedNpcs: [],
		isShiftPressed: false,
	})

	const [locationSelector, setLocationSelector] =
		useState<LocationSelectorState>({
			isOpen: false,
			availableLocations: [],
			hoveredLocation: null,
			mousePosition: { x: 0, y: 0 },
			selectedLocation: null,
		})

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
				setPortalSelector((prev) => ({ ...prev, isShiftPressed: true }))
				setNpcSelector((prev) => ({ ...prev, isShiftPressed: true }))
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
				setPortalSelector((prev) => {
					if (prev.selectedPortals.length > 0) {
						// Add all selected portals to the location
						addMultiplePortalsToLocation(prev.selectedPortals)
						// Close the modal after adding portals
						setTimeout(() => closePortalSelector(), 100)
						return {
							...prev,
							selectedPortals: [],
							isShiftPressed: false,
							isOpen: false,
						}
					}
					return {
						...prev,
						isShiftPressed: false,
					}
				})
				setNpcSelector((prev) => {
					if (prev.selectedNpcs.length > 0) {
						// Add all selected NPCs to the location
						addMultipleNpcsToLocation(prev.selectedNpcs)
						// Close the modal after adding NPCs
						setTimeout(() => closeNpcSelector(), 100)
						return {
							...prev,
							selectedNpcs: [],
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

	const handleClose = async () => {
		if (formData) {
			await onSave(formData)
		}
		onClose()
	}

	const updateFormData = (updates: Partial<Entity>) => {
		setFormData((prev) => (prev ? { ...prev, ...updates } : null))
	}

	const handleUpdateQuestStep = (
		questId: string,
		stepId: string,
		updates: Partial<QuestStep>
	) => {
		if (!onUpdateQuest) return

		const quest = availableQuests.find((q) => q.id === questId)
		if (!quest) return

		const updatedSteps = quest.steps.map((step) =>
			step.id === stepId ? { ...step, ...updates } : step
		)

		onUpdateQuest(questId, { steps: updatedSteps })
	}

	const saveDialogueSequence = (updatedSequence: DialogueSequence) => {
		if (entityType === 'dialogue') {
			// Handle standalone dialogue sequence editing
			updateFormData(updatedSequence)
		}
		// Don't close here - let the modal close handler handle it with auto-save
	}

	const closeDialogueEditor = () => {
		setDialogueEditor({ isOpen: false, sequenceIndex: null, sequence: null })
	}

	const openDialogueEditor = (sequence: DialogueSequence) => {
		setDialogueEditor({
			isOpen: true,
			sequenceIndex: null,
			sequence: JSON.parse(JSON.stringify(sequence)), // Deep copy
		})
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

	// Portal selector management functions
	const openPortalSelector = () => {
		if (entityType !== 'location' || !formData) return

		const location = formData as Location
		const existingPortalIds = location.portals.map((portal) => portal.id)

		// Filter out portals that are already in the location
		const filteredPortals = availablePortals.filter(
			(portal) => !existingPortalIds.includes(portal.id)
		)

		setPortalSelector({
			isOpen: true,
			availablePortals: filteredPortals,
			hoveredPortal: null,
			mousePosition: { x: 0, y: 0 },
			selectedPortals: [],
			isShiftPressed: false,
		})
	}

	const closePortalSelector = () => {
		setPortalSelector({
			isOpen: false,
			availablePortals: [],
			hoveredPortal: null,
			mousePosition: { x: 0, y: 0 },
			selectedPortals: [],
			isShiftPressed: false,
		})
	}

	const selectPortal = (portal: Portal) => {
		if (!formData || entityType !== 'location') return

		const location = formData as Location
		// Check if portal is already in the location
		const portalExists = location.portals.some(
			(existingPortal) => existingPortal.id === portal.id
		)

		if (!portalExists) {
			// Add the portal to the location with default properties
			const newPortalData = {
				id: portal.id,
				name: portal.name,
				image: portal.image,
				audioOnInteraction: portal.audio || '',
				audioOnGrab: '',
				state: EntityState.World,
				interactive: portal.interactive,
				onInteract: portal.onInteract || [],
				destinationLocationId: portal.destinationLocationId,
			}

			const newPortals = [...location.portals, newPortalData]
			updateFormData({ portals: newPortals })
		}

		closePortalSelector()
	}

	// NPC selector management functions
	const openNpcSelector = () => {
		if (entityType !== 'location' || !formData) return

		const location = formData as Location
		const existingNpcIds = location.npcs.map((npc) => npc.id)

		// Filter out NPCs that are already in the location
		const filteredNpcs = availableNpcs.filter(
			(npc) => !existingNpcIds.includes(npc.id)
		)

		setNpcSelector({
			isOpen: true,
			availableNpcs: filteredNpcs,
			hoveredNpc: null,
			mousePosition: { x: 0, y: 0 },
			selectedNpcs: [],
			isShiftPressed: false,
		})
	}

	const closeNpcSelector = () => {
		setNpcSelector({
			isOpen: false,
			availableNpcs: [],
			hoveredNpc: null,
			mousePosition: { x: 0, y: 0 },
			selectedNpcs: [],
			isShiftPressed: false,
		})
	}

	const selectNpc = (npc: NPC) => {
		if (!formData || entityType !== 'location') return

		const location = formData as Location
		// Check if NPC is already in the location
		const npcExists = location.npcs.some(
			(existingNpc) => existingNpc.id === npc.id
		)

		if (!npcExists) {
			// Add the NPC to the location with default properties
			const newNpcData = {
				id: npc.id,
				name: npc.name,
				image: npc.image,
				state: EntityState.World,
				onInteract: npc.onInteract || [],
			}

			const newNpcs = [...location.npcs, newNpcData]
			updateFormData({ npcs: newNpcs })
		}

		closeNpcSelector()
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

	const addMultiplePortalsToLocation = (portals: Portal[]) => {
		if (!formData || entityType !== 'location') return

		const location = formData as Location
		const newPortals = [...location.portals]

		portals.forEach((portal) => {
			// Check if portal is already in the location
			const portalExists = newPortals.some(
				(existingPortal) => existingPortal.id === portal.id
			)

			if (!portalExists) {
				// Add the portal to the location with default properties
				const newPortalData = {
					id: portal.id,
					name: portal.name,
					image: portal.image,
					audioOnInteraction: portal.audio || '',
					audioOnGrab: '',
					state: EntityState.World,
					interactive: portal.interactive,
					onInteract: portal.onInteract || [],
					destinationLocationId: portal.destinationLocationId,
				}

				newPortals.push(newPortalData)
			}
		})

		updateFormData({ portals: newPortals })
	}

	const addMultipleNpcsToLocation = (npcs: NPC[]) => {
		if (!formData || entityType !== 'location') return

		const location = formData as Location
		const newNpcs = [...location.npcs]

		npcs.forEach((npc) => {
			// Check if NPC is already in the location
			const npcExists = newNpcs.some((existingNpc) => existingNpc.id === npc.id)

			if (!npcExists) {
				// Add the NPC to the location with default properties
				const newNpcData = {
					id: npc.id,
					name: npc.name,
					image: npc.image,
					state: EntityState.World,
					onInteract: npc.onInteract || [],
				}

				newNpcs.push(newNpcData)
			}
		})

		updateFormData({ npcs: newNpcs })
	}

	// Location selector management functions
	const openLocationSelector = () => {
		if (entityType !== 'portal' || !formData) return

		const portal = formData as Portal
		// Show all available locations - portals can link to any location
		const filteredLocations = availableLocations

		setLocationSelector({
			isOpen: true,
			availableLocations: filteredLocations,
			hoveredLocation: null,
			mousePosition: { x: 0, y: 0 },
			selectedLocation:
				availableLocations.find(
					(loc) => loc.id === portal.destinationLocationId
				) || null,
		})
	}

	const closeLocationSelector = () => {
		setLocationSelector({
			isOpen: false,
			availableLocations: [],
			hoveredLocation: null,
			mousePosition: { x: 0, y: 0 },
			selectedLocation: null,
		})
	}

	const selectLocation = (location: Location) => {
		if (!formData || entityType !== 'portal') return

		updateFormData({ destinationLocationId: location.id })
		closeLocationSelector()
	}

	const renderLocationForm = () => {
		const location = formData as Location
		return (
			<div className='edit-form'>
				<div className='form-group'>
					<label>ID:</label>
					<input
						type='text'
						value={location.id}
						readOnly
						style={{ backgroundColor: '#333', cursor: 'not-allowed' }}
					/>
				</div>
				<div className='form-group'>
					<label>Name:</label>
					<input
						type='text'
						value={location.name}
						onChange={(e) => updateFormData({ name: e.target.value })}
					/>
				</div>
				<div className='form-group'>
					<label>Background Music:</label>
					<input
						type='text'
						value={location.backgroundMusic}
						onChange={(e) =>
							updateFormData({ backgroundMusic: e.target.value })
						}
						placeholder='/assets/music/...'
					/>
				</div>
				<div className='form-group'>
					<label>Image:</label>
					<input
						type='text'
						value={location.image}
						onChange={(e) => updateFormData({ image: e.target.value })}
						placeholder='/assets/images/...'
					/>
				</div>
				<div className='form-group'>
					<label>Items:</label>
					<div className='array-list'>
						{location.items.map((item, index) => (
							<div key={index} className='array-item location-item'>
								<div className='item-display'>
									<div className='item-icon'>
										{item.image ? (
											<img
												src={item.image}
												alt={item.name}
												className='item-thumbnail'
											/>
										) : (
											<div className='no-thumbnail'>?</div>
										)}
									</div>
									<span className='item-info'>
										<span className='item-name'>{item.name}</span>
										<span className='item-id'>({item.id})</span>
									</span>
								</div>
								<button
									type='button'
									className='remove-button'
									onClick={() => {
										const newItems = location.items.filter(
											(_, i) => i !== index
										)
										updateFormData({ items: newItems })
									}}
								>
									Remove
								</button>
							</div>
						))}
						<button
							type='button'
							className='add-array-button'
							onClick={openItemSelector}
						>
							Add Item
						</button>
					</div>
				</div>
				<div className='form-group'>
					<label>NPCs:</label>
					<div className='array-list'>
						{location.npcs.map((npc, index) => (
							<div key={index} className='array-item location-npc'>
								<div className='npc-display'>
									<div className='npc-icon'>
										{npc.image ? (
											<img
												src={npc.image}
												alt={npc.name}
												className='npc-thumbnail'
											/>
										) : (
											<div className='no-thumbnail'>?</div>
										)}
									</div>
									<span className='npc-info'>
										<span className='npc-name'>{npc.name}</span>
										<span className='npc-id'>({npc.id})</span>
									</span>
								</div>
								<button
									type='button'
									className='remove-button'
									onClick={() => {
										const newNpcs = location.npcs.filter((_, i) => i !== index)
										updateFormData({ npcs: newNpcs })
									}}
								>
									Remove
								</button>
							</div>
						))}
						<button
							type='button'
							className='add-array-button'
							onClick={openNpcSelector}
						>
							Add NPC
						</button>
					</div>
				</div>
				<div className='form-group'>
					<label>Portals:</label>
					<div className='array-list'>
						{location.portals.map((portal, index) => (
							<div key={index} className='array-item location-portal'>
								<div className='portal-display'>
									<div className='portal-icon'>
										{portal.image ? (
											<img
												src={portal.image}
												alt={portal.name}
												className='portal-thumbnail'
											/>
										) : (
											<div className='no-thumbnail'>?</div>
										)}
									</div>
									<span className='portal-info'>
										<span className='portal-name'>{portal.name}</span>
										<span className='portal-id'>({portal.id})</span>
									</span>
								</div>
								<button
									type='button'
									className='remove-button'
									onClick={() => {
										const newPortals = location.portals.filter(
											(_, i) => i !== index
										)
										updateFormData({ portals: newPortals })
									}}
								>
									Remove
								</button>
							</div>
						))}
						<button
							type='button'
							className='add-array-button'
							onClick={openPortalSelector}
						>
							Add Portal
						</button>
					</div>
				</div>
			</div>
		)
	}

	const renderNPCForm = () => {
		const npc = formData as NPC
		return (
			<div className='edit-form'>
				<div className='form-group'>
					<label>ID:</label>
					<input
						type='text'
						value={npc.id}
						readOnly
						style={{ backgroundColor: '#333', cursor: 'not-allowed' }}
					/>
				</div>
				<div className='form-group'>
					<label>Name:</label>
					<input
						type='text'
						value={npc.name}
						onChange={(e) => updateFormData({ name: e.target.value })}
					/>
				</div>
				<div className='form-group'>
					<label>Image:</label>
					<input
						type='text'
						value={npc.image || ''}
						onChange={(e) => {
							const inputValue = e.target.value.trim()
							// Always save just the filename, add prefix on display
							updateFormData({ image: inputValue })
						}}
						placeholder='npc_1.png'
					/>
				</div>
			</div>
		)
	}

	const renderItemForm = () => {
		const item = formData as Item
		return (
			<div className='edit-form'>
				<div className='form-group'>
					<label>ID:</label>
					<input
						type='text'
						value={item.id}
						readOnly
						style={{ backgroundColor: '#333', cursor: 'not-allowed' }}
					/>
				</div>
				<div className='form-group'>
					<label>Name:</label>
					<input
						type='text'
						value={item.name}
						onChange={(e) => updateFormData({ name: e.target.value })}
					/>
				</div>
				<div className='form-group'>
					<label>Image:</label>
					<input
						type='text'
						value={item.image}
						onChange={(e) => updateFormData({ image: e.target.value })}
						placeholder='/assets/images/...'
					/>
				</div>
				<div className='form-group'>
					<label>Audio:</label>
					<input
						type='text'
						value={item.audio || ''}
						onChange={(e) => updateFormData({ audio: e.target.value })}
						placeholder='/assets/sfx/...'
					/>
				</div>
				<div className='form-group'>
					<label>Interactive:</label>
					<select
						value={item.interactive}
						onChange={(e) =>
							updateFormData({ interactive: e.target.value as InteractiveMode })
						}
					>
						<option value={InteractiveMode.NotInteractive}>
							Not Interactive
						</option>
						<option value={InteractiveMode.Grabbable}>Grabbable</option>
						<option value={InteractiveMode.Interactive}>Interactive</option>
					</select>
				</div>
			</div>
		)
	}

	const renderPortalForm = () => {
		const portal = formData as Portal

		// Find the currently selected location for display
		const selectedLocation = availableLocations.find(
			(loc) => loc.id === portal.destinationLocationId
		)

		return (
			<div className='edit-form'>
				{renderItemForm()}
				<div className='form-group'>
					<label>Destination Location:</label>
					<div className='location-selector-container'>
						<div
							className='item-selector-display'
							onClick={openLocationSelector}
						>
							{selectedLocation ? (
								<div className='selected-location'>
									<div className='item-icon'>
										{selectedLocation.image ? (
											<img
												src={selectedLocation.image}
												alt={selectedLocation.name}
												className='item-thumbnail'
											/>
										) : (
											<div className='no-thumbnail'>?</div>
										)}
									</div>
									<span className='item-info'>
										<span className='item-name'>{selectedLocation.name}</span>
										<span className='item-id'>({selectedLocation.id})</span>
									</span>
								</div>
							) : (
								<div className='no-location-selected'>
									Click to select destination location
								</div>
							)}
							<span className='dropdown-arrow'>▼</span>
						</div>
					</div>
				</div>
			</div>
		)
	}

	const renderItemSelector = () => {
		if (!itemSelector.isOpen) return null

		return (
			<div className='modal-overlay' onClick={closeItemSelector}>
				<div
					className='modal-content item-selector'
					onClick={(e) => e.stopPropagation()}
				>
					<div className='modal-header'>
						<h2>Select Item to Add</h2>
						<button className='modal-close' onClick={closeItemSelector}>
							&times;
						</button>
					</div>
					<div className='modal-body'>
						<div className='selector-help'>
							<p>
								💡 Hold <kbd>Shift</kbd> to select multiple items. Release to
								add all selected items.
							</p>
							{itemSelector.selectedItems.length > 0 && (
								<p className='selection-count'>
									{itemSelector.selectedItems.length} item
									{itemSelector.selectedItems.length !== 1 ? 's' : ''} selected
								</p>
							)}
						</div>
						{itemSelector.availableItems.length === 0 ? (
							<div className='no-items'>
								<p>
									No items available or all items are already added to this
									location.
								</p>
							</div>
						) : (
							<div className='item-grid'>
								{itemSelector.availableItems.map((item) => (
									<div
										key={item.id}
										className={`item-slot ${
											itemSelector.selectedItems.some(
												(selected) => selected.id === item.id
											)
												? 'selected'
												: ''
										}`}
										onClick={(e) => {
											if (itemSelector.isShiftPressed) {
												// Multi-selection mode
												setItemSelector((prev) => {
													const isSelected = prev.selectedItems.some(
														(selected) => selected.id === item.id
													)
													if (isSelected) {
														// Remove from selection
														return {
															...prev,
															selectedItems: prev.selectedItems.filter(
																(selected) => selected.id !== item.id
															),
														}
													} else {
														// Add to selection
														return {
															...prev,
															selectedItems: [...prev.selectedItems, item],
														}
													}
												})
											} else {
												// Single selection mode
												selectItem(item)
											}
										}}
										onMouseEnter={(e) => {
											setUnifiedTooltip({
												entity: item,
												position: { x: e.clientX, y: e.clientY },
											})
										}}
										onMouseMove={(e) => {
											setUnifiedTooltip((prev) => ({
												...prev,
												position: { x: e.clientX, y: e.clientY },
											}))
										}}
										onMouseLeave={() => {
											setUnifiedTooltip({ entity: null, position: null })
										}}
									>
										<div className='item-image-container'>
											{item.image ? (
												<img
													src={item.image}
													alt={item.name}
													className='item-image'
												/>
											) : (
												<div className='no-image'>No Image</div>
											)}
										</div>
										<div className='item-name'>{item.name}</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
				{/* Unified tooltip */}
				{unifiedTooltip.entity && unifiedTooltip.position && (
					<EntityTooltip
						entity={unifiedTooltip.entity}
						position={unifiedTooltip.position}
						visible={true}
					>
						<div></div>
					</EntityTooltip>
				)}
			</div>
		)
	}

	const renderPortalSelector = () => {
		if (!portalSelector.isOpen) return null

		return (
			<div className='modal-overlay' onClick={closePortalSelector}>
				<div
					className='modal-content portal-selector'
					onClick={(e) => e.stopPropagation()}
				>
					<div className='modal-header'>
						<h2>Select Portal to Add</h2>
						<button className='modal-close' onClick={closePortalSelector}>
							&times;
						</button>
					</div>
					<div className='modal-body'>
						<div className='selector-help'>
							<p>
								💡 Hold <kbd>Shift</kbd> to select multiple portals. Release to
								add all selected portals.
							</p>
							{portalSelector.selectedPortals.length > 0 && (
								<p className='selection-count'>
									{portalSelector.selectedPortals.length} portal
									{portalSelector.selectedPortals.length !== 1 ? 's' : ''}{' '}
									selected
								</p>
							)}
						</div>
						{portalSelector.availablePortals.length === 0 ? (
							<div className='no-portals'>
								<p>
									No portals available or all portals are already added to this
									location.
								</p>
							</div>
						) : (
							<div className='portal-grid'>
								{portalSelector.availablePortals.map((portal) => (
									<div
										key={portal.id}
										className={`portal-slot ${
											portalSelector.selectedPortals.some(
												(selected) => selected.id === portal.id
											)
												? 'selected'
												: ''
										}`}
										onClick={(e) => {
											if (portalSelector.isShiftPressed) {
												// Multi-selection mode
												setPortalSelector((prev) => {
													const isSelected = prev.selectedPortals.some(
														(selected) => selected.id === portal.id
													)
													if (isSelected) {
														// Remove from selection
														return {
															...prev,
															selectedPortals: prev.selectedPortals.filter(
																(selected) => selected.id !== portal.id
															),
														}
													} else {
														// Add to selection
														return {
															...prev,
															selectedPortals: [
																...prev.selectedPortals,
																portal,
															],
														}
													}
												})
											} else {
												// Single selection mode
												selectPortal(portal)
											}
										}}
										onMouseEnter={(e) => {
											setUnifiedTooltip({
												entity: portal,
												position: { x: e.clientX, y: e.clientY },
											})
										}}
										onMouseMove={(e) => {
											setUnifiedTooltip((prev) => ({
												...prev,
												position: { x: e.clientX, y: e.clientY },
											}))
										}}
										onMouseLeave={() => {
											setUnifiedTooltip({ entity: null, position: null })
										}}
									>
										<div className='portal-image-container'>
											{portal.image ? (
												<img
													src={portal.image}
													alt={portal.name}
													className='portal-image'
												/>
											) : (
												<div className='no-image'>No Image</div>
											)}
										</div>
										<div className='portal-name'>{portal.name}</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	const renderNpcSelector = () => {
		if (!npcSelector.isOpen) return null

		return (
			<div className='modal-overlay' onClick={closeNpcSelector}>
				<div
					className='modal-content npc-selector'
					onClick={(e) => e.stopPropagation()}
				>
					<div className='modal-header'>
						<h2>Select NPC to Add</h2>
						<button className='modal-close' onClick={closeNpcSelector}>
							&times;
						</button>
					</div>
					<div className='modal-body'>
						<div className='selector-help'>
							<p>
								💡 Hold <kbd>Shift</kbd> to select multiple NPCs. Release to add
								all selected NPCs.
							</p>
							{npcSelector.selectedNpcs.length > 0 && (
								<p className='selection-count'>
									{npcSelector.selectedNpcs.length} NPC
									{npcSelector.selectedNpcs.length !== 1 ? 's' : ''} selected
								</p>
							)}
						</div>
						{npcSelector.availableNpcs.length === 0 ? (
							<div className='no-npcs'>
								<p>
									No NPCs available or all NPCs are already added to this
									location.
								</p>
							</div>
						) : (
							<div className='npc-grid'>
								{npcSelector.availableNpcs.map((npc) => (
									<div
										key={npc.id}
										className={`npc-slot ${
											npcSelector.selectedNpcs.some(
												(selected) => selected.id === npc.id
											)
												? 'selected'
												: ''
										}`}
										onClick={(e) => {
											if (npcSelector.isShiftPressed) {
												// Multi-selection mode
												setNpcSelector((prev) => {
													const isSelected = prev.selectedNpcs.some(
														(selected) => selected.id === npc.id
													)
													if (isSelected) {
														// Remove from selection
														return {
															...prev,
															selectedNpcs: prev.selectedNpcs.filter(
																(selected) => selected.id !== npc.id
															),
														}
													} else {
														// Add to selection
														return {
															...prev,
															selectedNpcs: [...prev.selectedNpcs, npc],
														}
													}
												})
											} else {
												// Single selection mode
												selectNpc(npc)
											}
										}}
										onMouseEnter={(e) => {
											setUnifiedTooltip({
												entity: npc,
												position: { x: e.clientX, y: e.clientY },
											})
										}}
										onMouseMove={(e) => {
											setUnifiedTooltip((prev) => ({
												...prev,
												position: { x: e.clientX, y: e.clientY },
											}))
										}}
										onMouseLeave={() => {
											setUnifiedTooltip({ entity: null, position: null })
										}}
									>
										<div className='npc-image-container'>
											{npc.image ? (
												<img
													src={npc.image}
													alt={npc.name}
													className='npc-image'
												/>
											) : (
												<div className='no-image'>No Image</div>
											)}
										</div>
										<div className='npc-name'>{npc.name}</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	const renderLocationSelector = () => {
		if (!locationSelector.isOpen) return null

		return (
			<div className='modal-overlay' onClick={closeLocationSelector}>
				<div
					className='modal-content location-selector'
					onClick={(e) => e.stopPropagation()}
				>
					<div className='modal-header'>
						<h2>Select Destination Location</h2>
						<button className='modal-close' onClick={closeLocationSelector}>
							&times;
						</button>
					</div>
					<div className='modal-body'>
						<div className='selector-help'>
							<p>💡 Click on a location to select it as the destination.</p>
							{locationSelector.selectedLocation && (
								<p className='selection-count'>
									Selected:{' '}
									<strong>{locationSelector.selectedLocation.name}</strong>
								</p>
							)}
						</div>
						{locationSelector.availableLocations.length === 0 ? (
							<div className='no-locations'>
								<p>No locations available.</p>
							</div>
						) : (
							<div className='item-grid'>
								{locationSelector.availableLocations.map((location) => (
									<div
										key={location.id}
										className={`item-slot ${
											locationSelector.selectedLocation?.id === location.id
												? 'selected'
												: ''
										}`}
										onClick={() => selectLocation(location)}
										onMouseEnter={(e) => {
											setUnifiedTooltip({
												entity: location,
												position: { x: e.clientX, y: e.clientY },
											})
										}}
										onMouseMove={(e) => {
											setUnifiedTooltip((prev) => ({
												...prev,
												position: { x: e.clientX, y: e.clientY },
											}))
										}}
										onMouseLeave={() => {
											setUnifiedTooltip({ entity: null, position: null })
										}}
									>
										<div className='item-image-container'>
											{location.image ? (
												<img
													src={location.image}
													alt={location.name}
													className='item-image'
												/>
											) : (
												<div className='no-image'>No Image</div>
											)}
										</div>
										<div className='item-name'>{location.name}</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	const renderDialogueEditor = () => {
		if (!dialogueEditor.isOpen || !dialogueEditor.sequence) return null

		const sequence = dialogueEditor.sequence

		const updateSequence = (updates: Partial<DialogueSequence>) => {
			setDialogueEditor((prev) => ({
				...prev,
				sequence: prev.sequence ? { ...prev.sequence, ...updates } : null,
			}))
		}

		const addDialog = () => {
			const newDialog: Dialog = {
				id: `dialog_${Date.now()}`,
				text: 'New dialog text',
				isQuestion: false,
				isEndOfDialog: false,
			}
			const updatedDialogs = [...sequence.dialogs, newDialog]
			updateSequence({ dialogs: updatedDialogs })
		}

		const updateDialog = (index: number, updates: Partial<Dialog>) => {
			const updatedDialogs = [...sequence.dialogs]
			updatedDialogs[index] = { ...updatedDialogs[index], ...updates }
			updateSequence({ dialogs: updatedDialogs })
		}

		const removeDialog = (index: number) => {
			const updatedDialogs = sequence.dialogs.filter((_, i) => i !== index)
			updateSequence({ dialogs: updatedDialogs })
		}

		const addButton = (dialogIndex: number) => {
			const dialog = sequence.dialogs[dialogIndex]
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
			const dialog = sequence.dialogs[dialogIndex]
			const updatedButtons = [...(dialog.buttons || [])]
			updatedButtons[buttonIndex] = {
				...updatedButtons[buttonIndex],
				...updates,
			}
			updateDialog(dialogIndex, { buttons: updatedButtons })
		}

		const removeButton = (dialogIndex: number, buttonIndex: number) => {
			const dialog = sequence.dialogs[dialogIndex]
			const updatedButtons = (dialog.buttons || []).filter(
				(_, i) => i !== buttonIndex
			)
			updateDialog(dialogIndex, { buttons: updatedButtons })
		}

		return (
			<div className='modal-overlay' onClick={closeDialogueEditor}>
				<div
					className='modal-content dialogue-editor modal-content-dialogue'
					onClick={(e) => e.stopPropagation()}
				>
					<div className='modal-header'>
						<h2>Edit Dialogue Sequence</h2>
						<button className='modal-close' onClick={closeDialogueEditor}>
							&times;
						</button>
					</div>
					<div className='modal-body'>
						<div className='form-group'>
							<label>Sequence Name:</label>
							<input
								type='text'
								value={sequence.name}
								onChange={(e) => updateSequence({ name: e.target.value })}
							/>
						</div>
						<div className='form-group'>
							<label>Dialogs: {sequence.dialogs.length}</label>
							<div className='dialogs-list'>
								{sequence.dialogs.map((dialog, dialogIndex) => (
									<div key={dialog.id} className='dialog-item'>
										<div className='dialog-header'>
											<span>
												Dialog {dialogIndex + 1} (ID: {dialog.id})
											</span>
											<button
												type='button'
												className='remove-button small'
												onClick={() => removeDialog(dialogIndex)}
											>
												Remove
											</button>
										</div>
										<div className='dialog-fields'>
											<div className='field-group'>
												<label>Text:</label>
												<textarea
													value={dialog.text}
													onChange={(e) =>
														updateDialog(dialogIndex, { text: e.target.value })
													}
													rows={3}
												/>
											</div>
											<div className='field-row'>
												<div className='dialog-type-buttons'>
													<button
														type='button'
														className={`dialog-type-button ${
															dialog.isQuestion ? 'active' : ''
														}`}
														onClick={() =>
															updateDialog(dialogIndex, {
																isQuestion: true,
																isEndOfDialog: false,
															})
														}
													>
														Is Question
													</button>
													<button
														type='button'
														className={`dialog-type-button ${
															dialog.isEndOfDialog ? 'active' : ''
														}`}
														onClick={() =>
															updateDialog(dialogIndex, {
																isQuestion: false,
																isEndOfDialog: true,
															})
														}
													>
														End of Dialog
													</button>
													<button
														type='button'
														className={`dialog-type-button ${
															!dialog.isQuestion && !dialog.isEndOfDialog
																? 'active'
																: ''
														}`}
														onClick={() =>
															updateDialog(dialogIndex, {
																isQuestion: false,
																isEndOfDialog: false,
															})
														}
													>
														Continue
													</button>
												</div>
											</div>
											{dialog.isQuestion && (
												<div className='buttons-section'>
													<label>Buttons:</label>
													<div className='buttons-list'>
														{(dialog.buttons || []).map(
															(button, buttonIndex) => (
																<div key={buttonIndex} className='button-item'>
																	<input
																		type='text'
																		placeholder='Button label'
																		value={button.label}
																		onChange={(e) =>
																			updateButton(dialogIndex, buttonIndex, {
																				label: e.target.value,
																			})
																		}
																	/>
																	<select
																		value={button.goToDialog}
																		onChange={(e) =>
																			updateButton(dialogIndex, buttonIndex, {
																				goToDialog: parseInt(e.target.value),
																			})
																		}
																	>
																		{sequence.dialogs.map((d, i) => (
																			<option key={i} value={i}>
																				{i}: {d.id}
																			</option>
																		))}
																	</select>
																	<input
																		type='number'
																		placeholder='Size'
																		value={button.size}
																		onChange={(e) =>
																			updateButton(dialogIndex, buttonIndex, {
																				size: parseInt(e.target.value) || 300,
																			})
																		}
																		min='100'
																		max='1000'
																		style={{ width: '80px' }}
																	/>
																	<button
																		type='button'
																		className='remove-button small'
																		onClick={() =>
																			removeButton(dialogIndex, buttonIndex)
																		}
																	>
																		Remove
																	</button>
																</div>
															)
														)}
														<button
															type='button'
															className='add-button small'
															onClick={() => addButton(dialogIndex)}
														>
															Add Button
														</button>
													</div>
												</div>
											)}
										</div>
									</div>
								))}
								<button
									type='button'
									className='add-array-button'
									onClick={addDialog}
								>
									Add Dialog
								</button>
							</div>
						</div>
					</div>
					<div className='modal-footer'>
						<button
							className='modal-button cancel'
							onClick={closeDialogueEditor}
						>
							Cancel
						</button>
						<button
							className='modal-button save'
							onClick={() => saveDialogueSequence(sequence)}
						>
							Save Sequence
						</button>
					</div>
				</div>
			</div>
		)
	}

	const renderForm = () => {
		switch (entityType) {
			case 'location':
				return (
					<LocationEditForm
						location={formData as Location}
						onUpdate={updateFormData}
						onOpenItemSelector={openItemSelector}
						onOpenNpcSelector={openNpcSelector}
						onOpenPortalSelector={openPortalSelector}
						availableItems={availableItems}
					/>
				)
			case 'quest':
				return (
					<QuestEditForm
						quest={formData as Quest}
						onUpdate={updateFormData}
						npcs={availableNpcs}
						items={availableItems}
						locations={availableLocations}
						quests={availableQuests}
						dialogues={availableDialogues}
					/>
				)
			case 'npc':
				return <NPCEditForm npc={formData as NPC} onUpdate={updateFormData} />
			case 'item':
				return (
					<ItemEditForm item={formData as Item} onUpdate={updateFormData} />
				)
			case 'portal':
				return (
					<PortalEditForm
						portal={formData as Portal}
						onUpdate={updateFormData}
						onOpenLocationSelector={openLocationSelector}
						availableLocations={availableLocations}
					/>
				)
			case 'dialogue':
				// Extract all quest steps from available quests
				const availableQuestSteps = availableQuests.flatMap((quest) =>
					quest.steps.map((step) => ({ ...step, questId: quest.id }))
				)

				return (
					<DialogueEditForm
						dialogue={formData as DialogueSequence}
						onUpdate={updateFormData}
						onOpenDialogueEditor={() =>
							openDialogueEditor(formData as DialogueSequence)
						}
						onUpdateQuestStep={handleUpdateQuestStep}
						availableNpcs={availableNpcs}
						availableQuests={availableQuests}
						availableQuestSteps={availableQuestSteps}
					/>
				)
			default:
				return <div>Unknown entity type</div>
		}
	}

	return (
		<>
			<div className='modal-overlay' onClick={handleClose}>
				<div
					className={`modal-content ${
						entityType === 'dialogue' ? 'modal-content-dialogue' : ''
					}`}
					onClick={(e) => e.stopPropagation()}
				>
					<div className='modal-header'>
						<h2>
							Edit {entityType.charAt(0).toUpperCase() + entityType.slice(1)}:{' '}
							{formData?.id}
						</h2>
						<button className='modal-close' onClick={handleClose}>
							&times;
						</button>
					</div>
					<div className='modal-body'>{renderForm()}</div>
				</div>
			</div>
			{renderDialogueEditor()}
			{renderItemSelector()}
			{renderPortalSelector()}
			{renderNpcSelector()}
			{renderLocationSelector()}
		</>
	)
}
