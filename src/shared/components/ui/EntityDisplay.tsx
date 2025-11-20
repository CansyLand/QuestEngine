import React, { useState, useEffect } from 'react'
import { Item, NPC, Portal, Location } from '@/core/models/types'
import { EntityTooltip, TooltipEntity } from './EntityTooltip'
import { ImageDisplay } from './ImagePicker'

export type EntityType = 'item' | 'npc' | 'portal' | 'location'

interface BaseEntity {
	id: string
	name: string
}

interface EntityDisplayProps<T extends BaseEntity> {
	entity: T
	variant?: 'list' | 'card' | 'selector' | 'compact'
	showImage?: boolean
	showId?: boolean
	showTooltip?: boolean
	onTooltipEntity?: (entity: TooltipEntity | null) => void
	onTooltipPosition?: (position: { x: number; y: number } | null) => void
	onRemove?: (index: number) => void
	index?: number
	className?: string
}

const EntityDisplay = <T extends BaseEntity>({
	entity,
	variant = 'list',
	showImage = true,
	showId = true,
	showTooltip = true,
	onTooltipEntity,
	onTooltipPosition,
	onRemove,
	index,
	className = '',
}: EntityDisplayProps<T>) => {
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

	const getEntityImage = (entity: any) => {
		let imagePath: string | undefined
		switch (entity.type || 'item') {
			case 'item':
				imagePath = (entity as Item).image
				break
			case 'npc':
				imagePath = (entity as NPC).image
				break
			case 'portal':
				imagePath = (entity as Portal).image
				break
			case 'location':
				imagePath = (entity as Location).image
				break
			default:
				return undefined
		}

		// Prepend project path for local images
		return imagePath && projectPath ? projectPath + imagePath : imagePath
	}

	const getEntityTypeLabel = (entity: any) => {
		if ('interactive' in entity) return 'Item'
		if ('dialogueSequences' in entity) return 'NPC'
		if ('destinationLocation' in entity) return 'Portal'
		return 'Location'
	}

	const handleMouseEnter = (e: React.MouseEvent) => {
		if (showTooltip && onTooltipEntity && onTooltipPosition) {
			onTooltipEntity(entity as unknown as TooltipEntity)
			onTooltipPosition({
				x: e.clientX,
				y: e.clientY,
			})
		}
	}

	const handleMouseMove = (e: React.MouseEvent) => {
		if (showTooltip && onTooltipPosition) {
			onTooltipPosition({
				x: e.clientX,
				y: e.clientY,
			})
		}
	}

	const handleMouseLeave = () => {
		if (showTooltip && onTooltipEntity && onTooltipPosition) {
			onTooltipEntity(null)
			onTooltipPosition(null)
		}
	}

	const imageUrl = getEntityImage(entity)
	const typeLabel = getEntityTypeLabel(entity)

	const containerClasses = variant === 'list'
		? `flex items-center gap-3 w-full ${className}`.trim()
		: `entity-display entity-${variant} ${className}`.trim()

	return (
		<>
			<div
				className={containerClasses}
				onMouseEnter={handleMouseEnter}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
			>
				{showImage && (
					<div className={variant === 'list' ? 'flex-shrink-0' : `entity-image entity-${typeLabel.toLowerCase()}-image`}>
						<ImageDisplay
							src={imageUrl || ''}
							alt={`${entity.name} image`}
							className={variant === 'list' ? 'w-8 h-8 object-cover rounded' : 'entity-thumbnail'}
							fallback={<div className={variant === 'list' ? 'w-8 h-8 bg-bg-hover rounded flex items-center justify-center text-text-muted text-xs' : 'no-image'}>?</div>}
						/>
					</div>
				)}
				<div className={variant === 'list' ? 'flex-1 min-w-0' : 'entity-info'}>
					<div className={variant === 'list' ? 'text-text-primary font-medium truncate' : 'entity-name'}>{entity.name}</div>
					{showId && <div className={variant === 'list' ? 'text-text-muted text-xs truncate' : 'entity-id'}>({entity.id})</div>}
				</div>
				{onRemove && index !== undefined && variant === 'list' && (
					<button
						type='button'
						className='text-danger hover:text-danger/80 px-2 text-lg leading-none'
						onClick={(e) => {
							e.stopPropagation()
							onRemove(index)
						}}
						title='Remove item'
					>
						×
					</button>
				)}
				{onRemove && index !== undefined && variant !== 'list' && (
					<button
						type='button'
						className='entity-remove-button'
						onClick={(e) => {
							e.stopPropagation()
							onRemove(index)
						}}
						title='Remove item'
					>
						×
					</button>
				)}
			</div>
		</>
	)
}

// Specialized display components for type safety
export const ItemDisplay: React.FC<
	Omit<EntityDisplayProps<Item>, 'entity'> & { entity: Item }
> = (props) => <EntityDisplay {...props} />

export const NPCDisplay: React.FC<
	Omit<EntityDisplayProps<NPC>, 'entity'> & { entity: NPC }
> = (props) => <EntityDisplay {...props} />

export const PortalDisplay: React.FC<
	Omit<EntityDisplayProps<Portal>, 'entity'> & { entity: Portal }
> = (props) => <EntityDisplay {...props} />

export const LocationDisplay: React.FC<
	Omit<EntityDisplayProps<Location>, 'entity'> & { entity: Location }
> = (props) => <EntityDisplay {...props} />

export { EntityDisplay }
