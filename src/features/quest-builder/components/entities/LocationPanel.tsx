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
