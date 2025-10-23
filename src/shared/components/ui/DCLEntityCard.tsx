import React, { useState, useEffect } from 'react'
import { Game } from '@/core/models/types'
import { ImageDisplay } from './ImagePicker'

export interface DCLEntity {
	id: string
	name: string
	position: { x: number; y: number; z: number }
	parent: number
	questEntityId: string | null
	parentName?: string
	parentId?: number
}

interface DCLEntityCardProps {
	entity: DCLEntity
	gameData: Game
	onDrop?: (e: React.DragEvent, entityId: string) => void
	onDragOver?: (e: React.DragEvent) => void
	draggingItemId?: string | null
	onDragStart?: (e: React.DragEvent, entity: DCLEntity) => void
	onDragEnd?: () => void
}

export const DCLEntityCard: React.FC<DCLEntityCardProps> = ({
	entity,
	gameData,
	onDrop,
	onDragOver,
	draggingItemId,
	onDragStart,
	onDragEnd,
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

	const getImageForEntity = (entityId: string): string => {
		// Search through all entity types to find the matching entity
		const allEntities = [
			...(gameData.items || []),
			...(gameData.npcs || []),
			...(gameData.portals || []),
			...(gameData.locations || []),
		]

		const foundEntity = allEntities.find((e) => e.id === entityId)
		const imagePath = foundEntity?.image || '/assets/images/default.png'

		// Prepend project path for local images
		return projectPath ? projectPath + imagePath : imagePath
	}

	const handleDrop = (e: React.DragEvent) => {
		onDrop?.(e, entity.id)
	}

	const handleDragOver = (e: React.DragEvent) => {
		onDragOver?.(e)
	}

	const handleDragStart = (e: React.DragEvent) => {
		if (entity.questEntityId && onDragStart) {
			e.dataTransfer.setData('text/plain', entity.questEntityId)
			onDragStart(e, entity)
		}
	}

	return (
		<div className='dcl-card' onDrop={handleDrop} onDragOver={handleDragOver}>
			<div className='dcl-card-content'>
				<div className='dcl-image-section'>
					{entity.questEntityId && entity.questEntityId !== draggingItemId ? (
						<div
							className='linked-item'
							draggable
							onDragStart={handleDragStart}
							onDragEnd={onDragEnd}
						>
							<ImageDisplay
								src={getImageForEntity(entity.questEntityId)}
								alt={entity.questEntityId}
								fallback={<div className='no-image'>No Image</div>}
							/>
						</div>
					) : (
						<div className='empty-drop-zone'>
							<span>Drop item here</span>
						</div>
					)}
				</div>
				<div className='dcl-info-section'>
					<div className='entity-name'>
						<strong>{entity.name}</strong>
					</div>
					<div className='entity-id'>ID: {entity.id}</div>
					<div className='entity-parent'>
						{entity.parentName
							? `Parent: ${entity.parentName}`
							: `Parent ID: ${entity.parent}`}
					</div>
				</div>
			</div>
		</div>
	)
}
