import React from 'react'
import { Location } from '@/core/models/types'
import { EntityPanel } from './EntityPanel'

interface LocationPanelProps {
	locations: Location[]
	onAdd: () => void
	onEdit: (location: Location) => void
	onDelete: (location: Location) => void
}

export const LocationPanel: React.FC<LocationPanelProps> = ({
	locations,
	onAdd,
	onEdit,
	onDelete,
}) => {
	return (
		<EntityPanel
			title='Locations'
			entities={locations}
			onAdd={onAdd}
			renderEntity={(location: Location) => {
				// Use the image link directly as provided
				const displayImage = location.image

				return (
					<div className='entity-card location-card'>
						<div className='location-image'>
							{displayImage ? (
								<img
									src={displayImage}
									alt={`${location.name} background`}
									className='location-image-preview'
								/>
							) : (
								<div className='no-image'>No Image</div>
							)}
						</div>
						<div className='location-details'>
							<h3>{location.name}</h3>
							<p>ID: {location.id}</p>
							<p>Music: {location.backgroundMusic}</p>
							<p>
								Items: {location.items.length}, NPCs: {location.npcs.length},
								Portals: {location.portals.length}
							</p>
						</div>
					</div>
				)
			}}
			onEdit={onEdit}
			onDelete={onDelete}
		/>
	)
}
