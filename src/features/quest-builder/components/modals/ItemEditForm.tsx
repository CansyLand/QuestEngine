import React, { useState, useEffect } from 'react'
import { Item, InteractiveMode, EntityState } from '@/core/models/types'
import { ImagePicker } from '../../../../shared/components/ui/ImagePicker'
import { useGameData } from '@/shared/hooks/useGameData'

interface ItemEditFormProps {
	item: Item
	onUpdate: (updates: Partial<Item>) => void
	availableItems?: Item[]
}

export const ItemEditForm: React.FC<ItemEditFormProps> = ({
	item,
	onUpdate,
	availableItems,
}) => {
	const { gameData } = useGameData()
	const [isCreatingType, setIsCreatingType] = useState(false)
	const [newTypeValue, setNewTypeValue] = useState('')

	// Get unique existing item types from all available items (both saved and being edited)
	const existingTypesFromData = Array.from(
		new Set(
			availableItems
				?.map((item) => item.type)
				?.filter((type) => type && type.trim() !== '') || []
		)
	)

	// Include the current item's type if it's not already in the list
	const allExistingTypes =
		item.type &&
		item.type.trim() !== '' &&
		!existingTypesFromData.includes(item.type)
			? [...existingTypesFromData, item.type].sort()
			: existingTypesFromData.sort()

	const handleTypeChange = (value: string) => {
		if (value === '__create_new__') {
			setIsCreatingType(true)
			setNewTypeValue('')
		} else {
			onUpdate({ type: value === '__none__' ? undefined : value })
			setIsCreatingType(false)
		}
	}

	const handleCreateType = () => {
		if (newTypeValue.trim()) {
			onUpdate({ type: newTypeValue.trim() })
			setIsCreatingType(false)
			setNewTypeValue('')
		}
	}

	const handleCancelCreate = () => {
		setIsCreatingType(false)
		setNewTypeValue('')
	}

	return (
		<div className='edit-form'>
			<div className='form-group'>
				<label>Name:</label>
				<input
					type='text'
					value={item.name}
					onChange={(e) => onUpdate({ name: e.target.value })}
				/>
			</div>
			<div className='form-group'>
				<label>Image:</label>
				<ImagePicker
					value={item.image}
					onChange={(value) => onUpdate({ image: value })}
				/>
			</div>
			<div className='form-group'>
				<label>Type:</label>
				{!isCreatingType ? (
					<select
						value={item.type || '__none__'}
						onChange={(e) => handleTypeChange(e.target.value)}
					>
						<option value='__none__'>No Type</option>
						{allExistingTypes.map((type) => (
							<option key={type} value={type}>
								{type}
							</option>
						))}
						<option value='__create_new__'>+ Create New Type</option>
					</select>
				) : (
					<div className='type-creation'>
						<input
							type='text'
							value={newTypeValue}
							onChange={(e) => setNewTypeValue(e.target.value)}
							placeholder='Enter new type name...'
							autoFocus
						/>
						<button
							type='button'
							onClick={handleCreateType}
							className='create-type-btn'
						>
							Create
						</button>
						<button
							type='button'
							onClick={handleCancelCreate}
							className='cancel-type-btn'
						>
							Cancel
						</button>
					</div>
				)}
			</div>
			<div className='form-group'>
				<label>Audio:</label>
				<input
					type='text'
					value={item.audio || ''}
					onChange={(e) => onUpdate({ audio: e.target.value })}
					placeholder='/assets/sfx/...'
				/>
			</div>
			<div className='form-group'>
				<label>Interactive:</label>
				<select
					value={item.interactive}
					onChange={(e) =>
						onUpdate({ interactive: e.target.value as InteractiveMode })
					}
				>
					<option value={InteractiveMode.NotInteractive}>
						Not Interactive
					</option>
					<option value={InteractiveMode.Grabbable}>Grabbable</option>
					<option value={InteractiveMode.Interactive}>Interactive</option>
				</select>
			</div>
			<div className='form-group'>
				<label>State:</label>
				<select
					value={item.state}
					onChange={(e) => onUpdate({ state: e.target.value as EntityState })}
				>
					<option value={EntityState.World}>World (visible in game)</option>
					<option value={EntityState.Inventory}>
						Inventory (in player inventory)
					</option>
					<option value={EntityState.Void}>
						Void (waiting to be activated)
					</option>
				</select>
			</div>
		</div>
	)
}
