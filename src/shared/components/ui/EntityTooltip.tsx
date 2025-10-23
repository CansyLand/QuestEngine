import React, { useState, useEffect } from 'react'
import { Item, NPC, Portal, Location } from '@/core/models/types'
import { ImageDisplay } from './ImagePicker'

export type TooltipEntity = Item | NPC | Portal | Location

export interface TooltipEntityBase {
	id: string
	name: string
	image: string
}

interface EntityTooltipProps {
	entity: TooltipEntityBase | null
	position: { x: number; y: number } | null
	visible: boolean
	children: React.ReactNode
}

export const EntityTooltip: React.FC<EntityTooltipProps> = ({
	entity,
	position,
	visible,
	children,
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

	const imageUrl =
		entity?.image && projectPath ? projectPath + entity.image : entity?.image

	return (
		<>
			{children}
			{visible && entity && position && (
				<div
					className='entity-tooltip'
					style={{
						position: 'fixed',
						left: position.x + 15,
						top: position.y - 10,
						pointerEvents: 'none',
						zIndex: 1000,
					}}
				>
					<div className='tooltip-content'>
						<div className='tooltip-header'>
							<div className='tooltip-image'>
								<ImageDisplay
									src={imageUrl || ''}
									alt={`${entity.name} image`}
									fallback={<div className='no-image'>?</div>}
								/>
							</div>
							<div className='tooltip-info'>
								<div className='tooltip-name'>{entity.name}</div>
								<div className='tooltip-id'>{entity.id}</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
