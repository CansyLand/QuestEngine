import React, { useState, useEffect } from 'react'
import {
	Portal,
	InteractiveMode,
	EntityState,
	Location,
} from '@/core/models/types'
import {
	ImagePicker,
	ImageDisplay,
} from '../../../../shared/components/ui/ImagePicker'

interface PortalEditFormProps {
	portal: Portal
	onUpdate: (updates: Partial<Portal>) => void
	onOpenLocationSelector: () => void
	availableLocations: Location[]
}

export const PortalEditForm: React.FC<PortalEditFormProps> = ({
	portal,
	onUpdate,
	onOpenLocationSelector,
	availableLocations,
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

	// Find the selected location to display its image
	const selectedLocation = portal.destinationLocationId
		? availableLocations.find((loc) => loc.id === portal.destinationLocationId)
		: null

	return (
		<div className='edit-form'>
			<div className='form-group'>
				<label>Name:</label>
				<input
					type='text'
					value={portal.name}
					onChange={(e) => onUpdate({ name: e.target.value })}
				/>
			</div>
			<div className='form-group'>
				<div className='two-column-layout'>
					<div className='column'>
						<label>Image:</label>
						<ImagePicker
							value={portal.image}
							onChange={(value) => onUpdate({ image: value })}
						/>
					</div>
					<div className='column'>
						<label>Destination Location:</label>
						<div
							className='location-picker-square'
							onClick={onOpenLocationSelector}
						>
							{selectedLocation?.image ? (
								<ImageDisplay
									src={
										projectPath
											? projectPath + selectedLocation.image
											: selectedLocation.image
									}
									alt={`Selected location: ${selectedLocation.name}`}
									fallback={
										<div className='location-text' style={{ display: 'flex' }}>
											Select Location
										</div>
									}
								/>
							) : null}
							{!selectedLocation?.image && (
								<div className='location-text' style={{ display: 'flex' }}>
									Select Location
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			<div className='form-group'>
				<label>Audio:</label>
				<input
					type='text'
					value={portal.audio || ''}
					onChange={(e) => onUpdate({ audio: e.target.value })}
					placeholder='/assets/sfx/...'
				/>
			</div>
			<div className='form-group'>
				<label>Interactive:</label>
				<select
					value={portal.interactive}
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
					value={portal.state}
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
