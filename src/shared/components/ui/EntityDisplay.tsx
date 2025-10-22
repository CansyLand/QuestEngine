import React, { useState } from 'react'
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
	const getEntityImage = (entity: any) => {
		switch (entity.type || 'item') {
			case 'item':
				return (entity as Item).image
			case 'npc':
				return (entity as NPC).image
			case 'portal':
				return (entity as Portal).image
			case 'location':
				return (entity as Location).image
			default:
				return undefined
		}
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

	const containerClasses =
		`entity-display entity-${variant} ${className}`.trim()

	return (
		<>
			<div
				className={containerClasses}
				onMouseEnter={handleMouseEnter}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
			>
				{showImage && (
					<div
						className={`entity-image entity-${typeLabel.toLowerCase()}-image`}
					>
						<ImageDisplay
							src={imageUrl || ''}
							alt={`${entity.name} image`}
							className='entity-thumbnail'
							fallback={<div className='no-image'>?</div>}
						/>
					</div>
				)}
				<div className='entity-info'>
					<div className='entity-name'>{entity.name}</div>
					{showId && <div className='entity-id'>({entity.id})</div>}
				</div>
				{onRemove && index !== undefined && (
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
