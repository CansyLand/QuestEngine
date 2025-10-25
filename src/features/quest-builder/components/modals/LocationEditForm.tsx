import React, { useState } from 'react'
import { Location, NPC, Portal, Item } from '@/core/models/types'
import { ArrayField } from '../../../../shared/components/ui/ArrayField'
import {
	ItemDisplay,
	NPCDisplay,
	PortalDisplay,
	LocationDisplay,
} from '../../../../shared/components/ui/EntityDisplay'
import {
	EntityTooltip,
	TooltipEntity,
} from '../../../../shared/components/ui/EntityTooltip'
import { ImagePicker } from '../../../../shared/components/ui/ImagePicker'

interface LocationEditFormProps {
	location: Location
	onUpdate: (updates: Partial<Location>) => void
	onOpenItemSelector: () => void
	onOpenNpcSelector: () => void
	onOpenPortalSelector: () => void
	onOpenLocationSelector: () => void
	onSaveGame?: () => void
	availableItems: Item[]
	availableLocations: Location[]
}

export const LocationEditForm: React.FC<LocationEditFormProps> = ({
	location,
	onUpdate,
	onOpenItemSelector,
	onOpenNpcSelector,
	onOpenPortalSelector,
	onOpenLocationSelector,
	onSaveGame,
	availableItems,
	availableLocations,
}) => {
	const [tooltipEntity, setTooltipEntity] = useState<TooltipEntity | null>(null)
	const [tooltipPosition, setTooltipPosition] = useState<{
		x: number
		y: number
	} | null>(null)

	const handleLocationReorder = (fromIndex: number, toIndex: number) => {
		const newLocations = [...location.locations]
		const [movedLocation] = newLocations.splice(fromIndex, 1)
		newLocations.splice(toIndex, 0, movedLocation)
		onUpdate({ locations: newLocations })

		// Save the game after reordering
		if (onSaveGame) {
			setTimeout(onSaveGame, 0)
		}
	}
	return (
		<div className='edit-form'>
			<div className='form-group'>
				<label>Name:</label>
				<input
					type='text'
					value={location.name}
					onChange={(e) => onUpdate({ name: e.target.value })}
				/>
			</div>
			<div className='form-group'>
				<label>Background Music:</label>
				<input
					type='text'
					value={location.backgroundMusic}
					onChange={(e) => onUpdate({ backgroundMusic: e.target.value })}
					placeholder='/assets/music/...'
				/>
			</div>
			<div className='form-group'>
				<label>Image:</label>
				<ImagePicker
					value={location.image}
					onChange={(value) => onUpdate({ image: value })}
				/>
			</div>
			<div className='form-group'>
				<label>Items:</label>
				<ArrayField
					items={location.items}
					onAdd={onOpenItemSelector}
					onRemove={(index) => {
						const newItems = location.items.filter((_, i) => i !== index)
						onUpdate({ items: newItems })
					}}
					renderItem={(item, index, onRemove) => (
						<ItemDisplay
							entity={item}
							variant='list'
							showId={false}
							showTooltip={true}
							onTooltipEntity={setTooltipEntity}
							onTooltipPosition={setTooltipPosition}
							onRemove={onRemove}
							index={index}
						/>
					)}
					addButtonText='Add Item'
					emptyMessage="No items in this location yet. Click 'Add Item' to add some."
				/>
			</div>
			<div className='form-group'>
				<label>NPCs:</label>
				<ArrayField
					items={location.npcs}
					onAdd={onOpenNpcSelector}
					onRemove={(index) => {
						const newNpcs = location.npcs.filter((_, i) => i !== index)
						onUpdate({ npcs: newNpcs })
					}}
					renderItem={(npc, index, onRemove) => (
						<NPCDisplay
							entity={npc}
							variant='list'
							showId={false}
							showTooltip={true}
							onTooltipEntity={setTooltipEntity}
							onTooltipPosition={setTooltipPosition}
							onRemove={onRemove}
							index={index}
						/>
					)}
					addButtonText='Add NPC'
					emptyMessage='No NPCs in this location yet.'
				/>
			</div>
			<div className='form-group'>
				<label>Portals:</label>
				<ArrayField
					items={location.portals}
					onAdd={onOpenPortalSelector}
					onRemove={(index) => {
						const newPortals = location.portals.filter((_, i) => i !== index)
						onUpdate({ portals: newPortals })
					}}
					renderItem={(portal, index, onRemove) => (
						<PortalDisplay
							entity={portal}
							variant='list'
							showId={false}
							showTooltip={true}
							onTooltipEntity={setTooltipEntity}
							onTooltipPosition={setTooltipPosition}
							onRemove={onRemove}
							index={index}
						/>
					)}
					addButtonText='Add Portal'
					emptyMessage='No portals in this location yet.'
				/>
			</div>
			<div className='form-group'>
				<label>Locations:</label>
				<ArrayField
					items={location.locations}
					onAdd={onOpenLocationSelector}
					onRemove={(index) => {
						const newLocations = location.locations.filter(
							(_, i) => i !== index
						)
						onUpdate({ locations: newLocations })
					}}
					onReorder={handleLocationReorder}
					renderItem={(childLocation, index, onRemove) => (
						<LocationDisplay
							entity={childLocation}
							variant='list'
							showId={false}
							showTooltip={true}
							onTooltipEntity={setTooltipEntity}
							onTooltipPosition={setTooltipPosition}
							onRemove={onRemove}
							index={index}
						/>
					)}
					addButtonText='Add Location'
					emptyMessage='No child locations in this location yet.'
					enableDragDrop={true}
				/>
			</div>

			<EntityTooltip
				entity={tooltipEntity}
				position={tooltipPosition}
				visible={tooltipEntity !== null && tooltipPosition !== null}
			>
				<div></div>
			</EntityTooltip>
		</div>
	)
}
