import React, { useState, useEffect } from 'react'
import { Location } from '@/core/models/types'
import { EntityPanel } from './EntityPanel'
import { ImageDisplay } from '@/shared/components/ui/ImagePicker'

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
	const [projectPath, setProjectPath] = useState<string | null>(null)

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

	return (
		<EntityPanel
			title='Locations'
			entities={locations}
			onAdd={onAdd}
			renderEntity={(location: Location) => {
				// Use the image link directly as provided
				const displayImage = projectPath
					? projectPath + location.image
					: location.image

				// Check if this is a parent location (has child locations)
				const isParentLocation =
					location.locations && location.locations.length > 0

				if (isParentLocation) {
					return (
						<div className='entity-card location-card parent-location-card'>
							<div className='parent-location-header'>
								<div className='location-image'>
									<ImageDisplay
										src={displayImage || ''}
										alt={`${location.name} background`}
										className='location-image-preview'
										fallback={<div className='no-image'>No Image</div>}
									/>
								</div>
								<div className='location-details'>
									<h3>{location.name} (Parent)</h3>
									<p>ID: {location.id}</p>
									<p>Music: {location.backgroundMusic}</p>
									<p>
										Items: {location.items.length}, NPCs: {location.npcs.length}
										, Portals: {location.portals.length}, Locations:{' '}
										{location.locations.length}
									</p>
								</div>
							</div>
							<div className='child-locations'>
								<h4>Child Locations:</h4>
								<div className='child-locations-grid'>
									{location.locations.map((childLocation) => {
										const childDisplayImage = projectPath
											? projectPath + childLocation.image
											: childLocation.image

										return (
											<div
												key={childLocation.id}
												className='entity-card child-location-card'
											>
												<div className='location-image'>
													<ImageDisplay
														src={childDisplayImage || ''}
														alt={`${childLocation.name} background`}
														className='location-image-preview'
														fallback={<div className='no-image'>No Image</div>}
													/>
												</div>
												<div className='location-details'>
													<h4>{childLocation.name}</h4>
													<p>ID: {childLocation.id}</p>
												</div>
											</div>
										)
									})}
								</div>
							</div>
						</div>
					)
				}

				return (
					<div className='entity-card location-card'>
						<div className='location-image'>
							<ImageDisplay
								src={displayImage || ''}
								alt={`${location.name} background`}
								className='location-image-preview'
								fallback={<div className='no-image'>No Image</div>}
							/>
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
