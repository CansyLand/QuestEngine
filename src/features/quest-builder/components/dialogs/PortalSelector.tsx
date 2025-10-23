import React, { useState, useEffect } from 'react'
import { Portal } from '@/core/models/types'
import { PortalSelectorState } from '@/features/quest-builder/types'
import { ImageDisplay } from '@/shared/components/ui/ImagePicker'

interface PortalSelectorProps {
	portalSelector: PortalSelectorState
	onClose: () => void
	onSelectPortal: (portal: Portal) => void
	onMouseEnter: (portal: Portal, e: React.MouseEvent) => void
	onMouseLeave: () => void
}

export const PortalSelector: React.FC<PortalSelectorProps> = ({
	portalSelector,
	onClose,
	onSelectPortal,
	onMouseEnter,
	onMouseLeave,
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

	if (!portalSelector.isOpen) return null

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div
				className='modal-content portal-selector'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='modal-header'>
					<h2>Select Portal to Add</h2>
					<button className='modal-close' onClick={onClose}>
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
							{portalSelector.availablePortals.map((portal) => {
								// Construct portal image URL with project path
								const portalImageUrl =
									portal.image && projectPath
										? projectPath + portal.image
										: portal.image

								return (
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
												// Multi-selection mode - handled in EditModal
												return
											} else {
												// Single selection mode
												onSelectPortal(portal)
											}
										}}
										onMouseEnter={(e) => onMouseEnter(portal, e)}
										onMouseLeave={onMouseLeave}
									>
										<div className='portal-image'>
											{portal.image ? (
												<ImageDisplay
													src={portalImageUrl || ''}
													alt={portal.name}
													fallback={<div className='no-image'>?</div>}
												/>
											) : (
												<div className='no-image'>?</div>
											)}
										</div>
										<div className='portal-name'>{portal.name}</div>
									</div>
								)
							})}
						</div>
					)}
				</div>
				<div className='modal-footer'>
					<button className='cancel-button' onClick={onClose}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	)
}
