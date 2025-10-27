import React, { useState, useEffect } from 'react'
import {
	QuestStep,
	Action,
	ActionType,
	NPC,
	Item,
	Location,
	Quest,
	InteractiveMode,
	DialogueSequence,
	Portal,
} from '@/core/models/types'
import { generateIdFromApi } from '@/shared/utils/api'
import { BaseModal } from '@/shared/components/ui/BaseModal'

interface QuestStepEditModalProps {
	isOpen: boolean
	step: QuestStep | null
	npcs: NPC[]
	items: Item[]
	locations: Location[]
	quests: Quest[]
	dialogues: DialogueSequence[]
	portals: Portal[]
	onSave: (step: QuestStep) => void
	onCancel: () => void
}

export const QuestStepEditModal: React.FC<QuestStepEditModalProps> = ({
	isOpen,
	step,
	npcs,
	items,
	locations,
	quests,
	dialogues,
	portals,
	onSave,
	onCancel,
}) => {
	const [formData, setFormData] = useState<QuestStep>({
		id: '',
		name: '',
		objectiveType: 'custom',
		objectiveParams: {},
		onStart: [],
		onComplete: [],
	})

	useEffect(() => {
		if (step) {
			setFormData(step)
		} else {
			setFormData({
				id: `step_${Date.now()}`,
				name: 'New Step',
				objectiveType: 'custom',
				objectiveParams: {},
				onStart: [],
				onComplete: [],
			})
		}
	}, [step, isOpen])

	// Auto-generate ID when name changes
	useEffect(() => {
		if (formData.name) {
			const currentId = formData.id

			// Debounce the API call
			const timeoutId = setTimeout(async () => {
				try {
					const response = await generateIdFromApi(
						formData.name,
						'quest-step',
						currentId
					)
					if (
						response.success &&
						response.data?.id &&
						response.data.id !== currentId
					) {
						setFormData((prev) => ({ ...prev, id: response.data.id }))
					}
				} catch (error) {
					console.error('Failed to generate ID:', error)
				}
			}, 300) // 300ms debounce

			return () => clearTimeout(timeoutId)
		}
	}, [formData.name, formData.id])

	const handleClose = () => {
		onSave(formData)
	}

	const updateObjectiveParams = (key: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			objectiveParams: { ...prev.objectiveParams, [key]: value },
		}))
	}

	const addAction = (target: 'onStart' | 'onComplete') => {
		const newAction: Action = {
			type: ActionType.SpawnEntity,
			params: {},
		}
		setFormData((prev) => ({
			...prev,
			[target]: [...prev[target], newAction],
		}))
	}

	const updateAction = (
		target: 'onStart' | 'onComplete',
		index: number,
		action: Action
	) => {
		setFormData((prev) => ({
			...prev,
			[target]: prev[target].map((a, i) => (i === index ? action : a)),
		}))
	}

	const removeAction = (target: 'onStart' | 'onComplete', index: number) => {
		setFormData((prev) => ({
			...prev,
			[target]: prev[target].filter((_, i) => i !== index),
		}))
	}

	const footer = (
		<div className='quest-step-modal-footer'>
			<button className='modal-button cancel' onClick={onCancel}>
				Cancel
			</button>
			<button className='modal-button save' onClick={handleClose}>
				Save Step
			</button>
		</div>
	)

	return (
		<BaseModal
			isOpen={isOpen}
			title={step ? 'Edit Quest Step' : 'Create Quest Step'}
			size='large'
			onClose={handleClose}
			footer={footer}
		>
			<div className='quest-step-edit-form'>
				<div className='form-group'>
					<label>Name:</label>
					<input
						type='text'
						value={formData.name}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, name: e.target.value }))
						}
					/>
				</div>

				{/* onStart Actions */}
				<div className='form-group'>
					<label>On Start Actions:</label>
					<div className='actions-list'>
						{formData.onStart.map((action, index) => (
							<ActionEditor
								key={index}
								action={action}
								onChange={(newAction) =>
									updateAction('onStart', index, newAction)
								}
								onRemove={() => removeAction('onStart', index)}
								items={items}
								npcs={npcs}
								locations={locations}
								quests={quests}
								dialogues={dialogues}
								portals={portals}
							/>
						))}
						<button
							type='button'
							className='add-action-button'
							onClick={() => addAction('onStart')}
						>
							Add On Start Action
						</button>
					</div>
				</div>

				<div className='form-group'>
					<label>Objective Type:</label>
					<select
						value={formData.objectiveType}
						onChange={(e) => {
							const newType = e.target.value as QuestStep['objectiveType']
							setFormData((prev) => ({
								...prev,
								objectiveType: newType,
								objectiveParams: {}, // Reset params when type changes
							}))
						}}
					>
						<option value='talkTo'>Talk to NPC</option>
						<option value='collectEntities'>Collect Specific Entities</option>
						<option value='collectByName'>Collect by Name</option>
						<option value='collectByType'>Collect by Type</option>
						<option value='interact'>Interact with Item</option>
						<option value='goToLocation'>Go to Location</option>
						<option value='custom'>Custom</option>
					</select>
				</div>

				{/* Objective-specific configuration */}
				{formData.objectiveType === 'talkTo' && (
					<div className='form-group'>
						<label>Select NPC:</label>
						<select
							value={formData.objectiveParams.npcId || ''}
							onChange={(e) => updateObjectiveParams('npcId', e.target.value)}
						>
							<option value=''>Choose an NPC...</option>
							{npcs.map((npc) => (
								<option key={npc.id} value={npc.id}>
									{npc.name}
								</option>
							))}
						</select>
					</div>
				)}

				{formData.objectiveType === 'collectEntities' && (
					<div className='form-group'>
						<label>Select Entities:</label>
						<div className='entity-selector'>
							{[...items, ...npcs].map((entity) => (
								<label key={entity.id} className='entity-checkbox'>
									<input
										type='checkbox'
										checked={(
											formData.objectiveParams.entityIds || []
										).includes(entity.id)}
										onChange={(e) => {
											const currentIds =
												formData.objectiveParams.entityIds || []
											if (e.target.checked) {
												updateObjectiveParams('entityIds', [
													...currentIds,
													entity.id,
												])
											} else {
												updateObjectiveParams(
													'entityIds',
													currentIds.filter((id: string) => id !== entity.id)
												)
											}
										}}
									/>
									{entity.name} ({entity.id})
								</label>
							))}
						</div>
					</div>
				)}

				{formData.objectiveType === 'collectByName' && (
					<>
						<div className='form-group'>
							<label>Select Item Type:</label>
							<select
								value={formData.objectiveParams.itemName || ''}
								onChange={(e) =>
									updateObjectiveParams('itemName', e.target.value)
								}
							>
								<option value=''>Choose an item type...</option>
								{/* Get unique item names */}
								{[...new Set(items.map((item) => item.name))].map(
									(itemName) => (
										<option key={itemName} value={itemName}>
											{itemName}
										</option>
									)
								)}
							</select>
						</div>
						<div className='form-group'>
							<label>Required Count:</label>
							<input
								type='number'
								min='1'
								value={formData.objectiveParams.count || 1}
								onChange={(e) =>
									updateObjectiveParams('count', parseInt(e.target.value) || 1)
								}
							/>
						</div>
					</>
				)}

				{formData.objectiveType === 'collectByType' && (
					<>
						<div className='form-group'>
							<label>Select Item Type:</label>
							<select
								value={formData.objectiveParams.itemType || ''}
								onChange={(e) =>
									updateObjectiveParams('itemType', e.target.value)
								}
							>
								<option value=''>Choose an item type...</option>
								{/* Get unique item types */}
								{[
									...new Set(
										items
											.map((item) => item.type)
											.filter((type) => type && type.trim() !== '')
									),
								].map((itemType) => (
									<option key={itemType} value={itemType}>
										{itemType}
									</option>
								))}
							</select>
						</div>
						<div className='form-group'>
							<label>Required Count:</label>
							<input
								type='number'
								min='1'
								value={formData.objectiveParams.count || 1}
								onChange={(e) =>
									updateObjectiveParams('count', parseInt(e.target.value) || 1)
								}
							/>
						</div>
					</>
				)}

				{formData.objectiveType === 'interact' && (
					<div className='form-group'>
						<label>Select Item:</label>
						<select
							value={formData.objectiveParams.itemId || ''}
							onChange={(e) => updateObjectiveParams('itemId', e.target.value)}
						>
							<option value=''>Choose an item...</option>
							{items.map((item) => (
								<option key={item.id} value={item.id}>
									{item.name}
								</option>
							))}
						</select>
					</div>
				)}

				{formData.objectiveType === 'goToLocation' && (
					<div className='form-group'>
						<label>Select Location:</label>
						<select
							value={formData.objectiveParams.locationId || ''}
							onChange={(e) =>
								updateObjectiveParams('locationId', e.target.value)
							}
						>
							<option value=''>Choose a location...</option>
							{locations.map((location) => (
								<option key={location.id} value={location.id}>
									{location.name}
								</option>
							))}
						</select>
					</div>
				)}

				{/* onComplete Actions */}
				<div className='form-group'>
					<label>On Complete Actions:</label>
					<div className='actions-list'>
						{formData.onComplete.map((action, index) => (
							<ActionEditor
								key={index}
								action={action}
								onChange={(newAction) =>
									updateAction('onComplete', index, newAction)
								}
								onRemove={() => removeAction('onComplete', index)}
								items={items}
								npcs={npcs}
								locations={locations}
								quests={quests}
								dialogues={dialogues}
								portals={portals}
							/>
						))}
						<button
							type='button'
							className='add-action-button'
							onClick={() => addAction('onComplete')}
						>
							Add On Complete Action
						</button>
					</div>
				</div>
			</div>
		</BaseModal>
	)
}

interface ActionEditorProps {
	action: Action
	onChange: (action: Action) => void
	onRemove: () => void
	items: Item[]
	npcs: NPC[]
	locations: Location[]
	quests: Quest[]
	dialogues: DialogueSequence[]
	portals: Portal[]
}

const ActionEditor: React.FC<ActionEditorProps> = ({
	action,
	onChange,
	onRemove,
	items,
	npcs,
	locations,
	quests,
	dialogues,
	portals,
}) => {
	const updateType = (type: ActionType) => {
		onChange({ type, params: {} })
	}

	const updateParam = (key: string, value: any) => {
		onChange({
			...action,
			params: { ...action.params, [key]: value },
		})
	}

	return (
		<div className='action-editor'>
			<select
				value={action.type}
				onChange={(e) => updateType(e.target.value as ActionType)}
			>
				<option value={ActionType.PlaySound}>Play Sound</option>
				<option value={ActionType.AddToInventory}>
					Add to Inventory (World → Inventory)
				</option>
				<option value={ActionType.GrantToInventory}>
					Grant to Inventory (Void → Inventory)
				</option>
				<option value={ActionType.RemoveFromInventory}>
					Remove from Inventory (by ID)
				</option>
				<option value={ActionType.RemoveFromInventoryByName}>
					Remove from Inventory (by Name)
				</option>
				<option value={ActionType.RemoveFromInventoryByType}>
					Remove from Inventory (by Type)
				</option>
				<option value={ActionType.SpawnEntity}>
					Spawn Entity (Void → World)
				</option>
				<option value={ActionType.SpawnEntityByType}>
					Spawn Entity (by Type)
				</option>
				<option value={ActionType.ClearEntity}>
					Clear Entity (World → Void)
				</option>
				<option value={ActionType.ClearEntityByType}>
					Clear Entity (by Type)
				</option>
				<option value={ActionType.SetInteractive}>
					Set Interactive Mode (by ID)
				</option>
				<option value={ActionType.SetInteractiveByName}>
					Set Interactive Mode (by Name)
				</option>
				<option value={ActionType.SetInteractiveByType}>
					Set Interactive Mode (by Type)
				</option>
				<option value={ActionType.ActivateQuest}>Activate Quest</option>
				<option value={ActionType.AdvanceStep}>Advance Step</option>
				<option value={ActionType.ChangeLocation}>Change Location</option>
				<option value={ActionType.StartDialogue}>Start Dialogue</option>
			</select>

			{/* Action-specific params */}
			{action.type === ActionType.PlaySound && (
				<input
					type='text'
					placeholder='Sound URL'
					value={action.params.soundUrl || ''}
					onChange={(e) => updateParam('soundUrl', e.target.value)}
				/>
			)}

			{action.type === ActionType.AddToInventory && (
				<select
					value={action.params.entityId || ''}
					onChange={(e) => updateParam('entityId', e.target.value)}
				>
					<option value=''>Select Entity</option>
					{[...items, ...npcs, ...portals].map((entity) => (
						<option key={entity.id} value={entity.id}>
							{entity.name} (
							{entity.id.includes('portal')
								? 'Portal'
								: entity.id.includes('npc')
								? 'NPC'
								: 'Item'}
							)
						</option>
					))}
				</select>
			)}

			{action.type === ActionType.GrantToInventory && (
				<select
					value={action.params.entityId || ''}
					onChange={(e) => updateParam('entityId', e.target.value)}
				>
					<option value=''>Select Entity</option>
					{[...items, ...npcs, ...portals].map((entity) => (
						<option key={entity.id} value={entity.id}>
							{entity.name} (
							{entity.id.includes('portal')
								? 'Portal'
								: entity.id.includes('npc')
								? 'NPC'
								: 'Item'}
							)
						</option>
					))}
				</select>
			)}

			{action.type === ActionType.SetInteractive && (
				<>
					<select
						value={action.params.entityId || ''}
						onChange={(e) => updateParam('entityId', e.target.value)}
					>
						<option value=''>Select Entity</option>
						{[...items, ...portals].map((entity) => (
							<option key={entity.id} value={entity.id}>
								{entity.name} (
								{entity.id.includes('portal') ? 'Portal' : 'Item'})
							</option>
						))}
					</select>
					<select
						value={action.params.interactiveMode || ''}
						onChange={(e) =>
							updateParam('interactiveMode', e.target.value as InteractiveMode)
						}
					>
						<option value={InteractiveMode.NotInteractive}>
							Not Interactive
						</option>
						<option value={InteractiveMode.Grabbable}>Grabbable</option>
						<option value={InteractiveMode.Interactive}>Interactive</option>
					</select>
				</>
			)}

			{action.type === ActionType.SetInteractiveByName && (
				<>
					<select
						value={action.params.itemName || ''}
						onChange={(e) => updateParam('itemName', e.target.value)}
					>
						<option value=''>Select Item Type</option>
						{[...new Set(items.map((item) => item.name))].map((itemName) => (
							<option key={itemName} value={itemName}>
								{itemName}
							</option>
						))}
					</select>
					<select
						value={action.params.interactiveMode || ''}
						onChange={(e) =>
							updateParam('interactiveMode', e.target.value as InteractiveMode)
						}
					>
						<option value={InteractiveMode.NotInteractive}>
							Not Interactive
						</option>
						<option value={InteractiveMode.Grabbable}>Grabbable</option>
						<option value={InteractiveMode.Interactive}>Interactive</option>
					</select>
				</>
			)}

			{action.type === ActionType.RemoveFromInventoryByType && (
				<>
					<select
						value={action.params.itemType || ''}
						onChange={(e) => updateParam('itemType', e.target.value)}
					>
						<option value=''>Select Item Type</option>
						{[
							...new Set(
								items
									.map((item) => item.type)
									.filter((type) => type && type.trim() !== '')
							),
						].map((itemType) => (
							<option key={itemType} value={itemType}>
								{itemType}
							</option>
						))}
					</select>
					<input
						type='number'
						min='1'
						placeholder='Count'
						value={action.params.count || 1}
						onChange={(e) =>
							updateParam('count', parseInt(e.target.value) || 1)
						}
					/>
				</>
			)}

			{action.type === ActionType.SpawnEntityByType && (
				<select
					value={action.params.entityType || ''}
					onChange={(e) => updateParam('entityType', e.target.value)}
				>
					<option value=''>Select Entity Type</option>
					{[
						...new Set(
							[...items, ...locations.flatMap((l) => l.portals)]
								.map((entity) => entity.type)
								.filter((type) => type && type.trim() !== '')
						),
					].map((entityType) => (
						<option key={entityType} value={entityType}>
							{entityType}
						</option>
					))}
				</select>
			)}

			{action.type === ActionType.ClearEntityByType && (
				<select
					value={action.params.entityType || ''}
					onChange={(e) => updateParam('entityType', e.target.value)}
				>
					<option value=''>Select Entity Type</option>
					{[
						...new Set(
							[...items, ...locations.flatMap((l) => l.portals)]
								.map((entity) => entity.type)
								.filter((type) => type && type.trim() !== '')
						),
					].map((entityType) => (
						<option key={entityType} value={entityType}>
							{entityType}
						</option>
					))}
				</select>
			)}

			{action.type === ActionType.SetInteractiveByType && (
				<>
					<select
						value={action.params.itemType || ''}
						onChange={(e) => updateParam('itemType', e.target.value)}
					>
						<option value=''>Select Item Type</option>
						{[
							...new Set(
								items
									.map((item) => item.type)
									.filter((type) => type && type.trim() !== '')
							),
						].map((itemType) => (
							<option key={itemType} value={itemType}>
								{itemType}
							</option>
						))}
					</select>
					<select
						value={action.params.interactiveMode || ''}
						onChange={(e) =>
							updateParam('interactiveMode', e.target.value as InteractiveMode)
						}
					>
						<option value={InteractiveMode.NotInteractive}>
							Not Interactive
						</option>
						<option value={InteractiveMode.Grabbable}>Grabbable</option>
						<option value={InteractiveMode.Interactive}>Interactive</option>
					</select>
				</>
			)}

			{action.type === ActionType.RemoveFromInventory && (
				<select
					value={action.params.entityId || ''}
					onChange={(e) => updateParam('entityId', e.target.value)}
				>
					<option value=''>Select Entity</option>
					{[...items, ...npcs, ...portals].map((entity) => (
						<option key={entity.id} value={entity.id}>
							{entity.name} (
							{entity.id.includes('portal')
								? 'Portal'
								: entity.id.includes('npc')
								? 'NPC'
								: 'Item'}
							)
						</option>
					))}
				</select>
			)}

			{action.type === ActionType.RemoveFromInventoryByName && (
				<>
					<select
						value={action.params.itemName || ''}
						onChange={(e) => updateParam('itemName', e.target.value)}
					>
						<option value=''>Select Item Type</option>
						{[...new Set(items.map((item) => item.name))].map((itemName) => (
							<option key={itemName} value={itemName}>
								{itemName}
							</option>
						))}
					</select>
					<input
						type='number'
						min='1'
						placeholder='Count'
						value={action.params.count || 1}
						onChange={(e) =>
							updateParam('count', parseInt(e.target.value) || 1)
						}
					/>
				</>
			)}

			{action.type === ActionType.SpawnEntity && (
				<select
					value={action.params.entityId || ''}
					onChange={(e) => updateParam('entityId', e.target.value)}
				>
					<option value=''>Select Entity</option>
					{[...items, ...npcs, ...locations, ...portals].map((entity) => (
						<option key={entity.id} value={entity.id}>
							{entity.name} (
							{entity.id.includes('portal')
								? 'Portal'
								: entity.id.includes('npc')
								? 'NPC'
								: entity.id.includes('location')
								? 'Location'
								: 'Item'}
							)
						</option>
					))}
				</select>
			)}

			{action.type === ActionType.ClearEntity && (
				<select
					value={action.params.entityId || ''}
					onChange={(e) => updateParam('entityId', e.target.value)}
				>
					<option value=''>Select Entity</option>
					{[...items, ...npcs, ...locations, ...portals].map((entity) => (
						<option key={entity.id} value={entity.id}>
							{entity.name} (
							{entity.id.includes('portal')
								? 'Portal'
								: entity.id.includes('npc')
								? 'NPC'
								: entity.id.includes('location')
								? 'Location'
								: 'Item'}
							)
						</option>
					))}
				</select>
			)}

			{action.type === ActionType.ActivateQuest && (
				<select
					value={action.params.questId || ''}
					onChange={(e) => updateParam('questId', e.target.value)}
				>
					<option value=''>Select Quest</option>
					{quests.map((quest) => (
						<option key={quest.id} value={quest.id}>
							{quest.title}
						</option>
					))}
				</select>
			)}

			{action.type === ActionType.ChangeLocation && (
				<select
					value={action.params.locationId || ''}
					onChange={(e) => updateParam('locationId', e.target.value)}
				>
					<option value=''>Select Location</option>
					{locations.map((location) => (
						<option key={location.id} value={location.id}>
							{location.name}
						</option>
					))}
				</select>
			)}

			{action.type === ActionType.StartDialogue && (
				<select
					value={action.params.dialogueSequenceId || ''}
					onChange={(e) => updateParam('dialogueSequenceId', e.target.value)}
				>
					<option value=''>Select Dialogue Sequence</option>
					{dialogues.map((dialogue) => (
						<option key={dialogue.id} value={dialogue.id}>
							{dialogue.name} ({dialogue.id})
						</option>
					))}
				</select>
			)}

			<button type='button' className='remove-action' onClick={onRemove}>
				Remove
			</button>
		</div>
	)
}
