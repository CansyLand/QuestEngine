import React, { useState, useEffect } from 'react'
import { Portal } from '@/core/models/types'
import { EntityPanel } from './EntityPanel'
import { ImageDisplay } from '@/shared/components/ui/ImagePicker'

interface PortalPanelProps {
	portals: Portal[]
	onAdd: () => void
	onEdit: (portal: Portal) => void
	onDelete: (portal: Portal) => void
}

export const PortalPanel: React.FC<PortalPanelProps> = ({
	portals,
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

	// Show all portals - they can be created without destinations assigned
	const filteredPortals = portals

	return (
		<EntityPanel
			title='Portals'
			entities={filteredPortals}
			onAdd={onAdd}
			renderEntity={(portal: Portal) => {
				const displayImage = projectPath
					? projectPath + portal.image
					: portal.image

				return (
					<div className='entity-card portal-card'>
						<div className='portal-image'>
							<ImageDisplay
								src={displayImage || ''}
								alt={`${portal.name} image`}
								className='portal-image-preview'
								fallback={<div className='no-image'>No Image</div>}
							/>
						</div>
						<div className='portal-details'>
							<h3>{portal.name}</h3>
							<p>Destination: {portal.destinationLocationId || 'Not set'}</p>
							<p>State: {portal.state}</p>
						</div>
					</div>
				)
			}}
			onEdit={onEdit}
			onDelete={onDelete}
		/>
	)
}
