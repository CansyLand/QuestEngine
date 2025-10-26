import React, { useMemo, useState, useEffect } from 'react'
import { ImageDisplay } from '@/shared/components/ui/ImagePicker'
import '@/shared/styles/Grid.css'

interface GridProps {
	onEntityClick: (entityType: string, entityId: string, params?: any) => void
	onExecuteCommand?: (command: any) => void
	backgroundImage: string
	entities?: any[]
	childLocations?: any[]
	currentChildLocationIndex?: number
	onNavigateChildLocation?: (direction: 'prev' | 'next') => void
	projectPath?: string | null
}

// Simple seeded random number generator
function seededRandom(seed: string): () => number {
	let x = 0
	for (let i = 0; i < seed.length; i++) {
		x += seed.charCodeAt(i)
	}
	return function () {
		x = (x * 9301 + 49297) % 233280
		return x / 233280
	}
}

export const Grid: React.FC<GridProps> = ({
	onEntityClick,
	onExecuteCommand,
	backgroundImage,
	entities = [],
	childLocations = [],
	currentChildLocationIndex = 0,
	onNavigateChildLocation,
	projectPath = null,
}) => {
	const [hoveredEntity, setHoveredEntity] = useState<any>(null)
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

	const getEntityImageUrl = (imagePath: string) => {
		return imagePath && projectPath ? projectPath + imagePath : imagePath
	}

	const getAudioUrl = (audioPath: string) => {
		return audioPath && projectPath ? projectPath + audioPath : audioPath
	}

	// Use the provided entities from the game state
	const gameEntities = useMemo(() => {
		// Create a stable grid representation
		// We'll maintain positions for all entities, even when they're not spawned
		const gridSize = 8
		const occupiedPositions = new Set<string>()

		// Helper function to find available position
		const findAvailablePosition = (
			random: () => number
		): { x: number; y: number } => {
			let attempts = 0
			while (attempts < 50) {
				const x = Math.floor(random() * gridSize)
				const y = Math.floor(random() * gridSize)
				const positionKey = `${x},${y}`
				if (!occupiedPositions.has(positionKey)) {
					occupiedPositions.add(positionKey)
					return { x, y }
				}
				attempts++
			}
			// Fallback to first available position
			for (let y = 0; y < gridSize; y++) {
				for (let x = 0; x < gridSize; x++) {
					const positionKey = `${x},${y}`
					if (!occupiedPositions.has(positionKey)) {
						occupiedPositions.add(positionKey)
						return { x, y }
					}
				}
			}
			// Ultimate fallback
			return { x: 0, y: 0 }
		}

		// Create a seeded random generator for consistent placement
		const random = seededRandom('grid-placement')

		// Process entities and maintain stable positions
		const processedEntities: any[] = []

		entities.forEach((entity) => {
			// If entity already has a position, keep it
			if (entity.x !== undefined && entity.y !== undefined) {
				const positionKey = `${entity.x},${entity.y}`
				occupiedPositions.add(positionKey)
				processedEntities.push(entity)
			} else {
				// Find a new position for entity
				const position = findAvailablePosition(random)
				processedEntities.push({
					...entity,
					x: position.x,
					y: position.y,
				})
			}
		})

		return processedEntities.map((entity) => ({
			...entity,
			// Map entity type for click handler
			entityType:
				entity.type === 'item'
					? 'Item'
					: entity.type === 'npc'
					? 'NPC'
					: 'Portal',
		}))
	}, [entities])

	const gridCells = useMemo(() => {
		const cells = []
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) {
				// Find entity at this position - show all entities including cleared ones
				const entity = gameEntities.find((e) => e.x === x && e.y === y)
				cells.push({
					x,
					y,
					entity,
					isInteractive: entity
						? entity.interactive !== 'notInteractive'
						: false,
				})
			}
		}
		return cells
	}, [gameEntities])

	const handleCellClick = async (x: number, y: number) => {
		console.log('Grid: handleCellClick called for position:', x, y)
		const entity = gameEntities.find((e) => e.x === x && e.y === y)
		console.log('Grid: Found entity:', entity)
		if (entity) {
			// For grabbable items, only play audio on click, don't collect
			// Collection happens via E key press
			if (entity.interactive === 'grabbable') {
				console.log(
					'Grid: Entity is grabbable, calling onEntityClick with playAudioOnly'
				)
				// Send interaction that only plays audio for grabbable items
				await onEntityClick(entity.entityType, entity.id, {
					playAudioOnly: true,
				})
			} else {
				console.log('Grid: Entity is not grabbable, calling onEntityClick')
				// For interactive items, normal click behavior
				await onEntityClick(entity.entityType, entity.id)
			}
		}
	}

	const handleMouseEnter = (entity: any, e: React.MouseEvent) => {
		console.log('🎵 Grid: handleMouseEnter triggered')
		console.log('🎵 Grid: entity:', entity)
		console.log('🎵 Grid: entity.audio:', entity?.audio)
		console.log('🎵 Grid: onExecuteCommand available:', !!onExecuteCommand)

		if (entity) {
			setHoveredEntity(entity)
			setMousePosition({ x: e.clientX, y: e.clientY })

			// Play hover audio if available
			if (entity.audio && onExecuteCommand) {
				console.log(
					'🎵 Grid: Sending playSound command for hover audio:',
					entity.audio
				)
				// Use the same command system as interaction audio for consistency
				onExecuteCommand({
					type: 'playSound',
					params: {
						url: entity.audio,
						volume: 0.3, // Lower volume for hover audio
					},
				})
			} else {
				console.log(
					'🎵 Grid: NOT sending playSound command - missing entity.audio or onExecuteCommand'
				)
			}
		} else {
			console.log('🎵 Grid: No entity in handleMouseEnter')
		}
	}

	const handleMouseMove = (e: React.MouseEvent) => {
		setMousePosition({ x: e.clientX, y: e.clientY })
	}

	const handleMouseLeave = () => {
		setHoveredEntity(null)
	}

	const getInteractionHint = (entity: any) => {
		if (!entity || entity.interactive === 'notInteractive') {
			return null
		}
		if (entity.interactive === 'interactive') {
			return 'Click to interact'
		}
		if (entity.interactive === 'grabbable') {
			return 'Click to interact and E for collect'
		}
		return null
	}

	// Add keyboard event handling
	useEffect(() => {
		const handleKeyPress = async (e: KeyboardEvent) => {
			if (e.key === 'e' || e.key === 'E') {
				if (hoveredEntity && hoveredEntity.interactive === 'grabbable') {
					// Send collect interaction for E key (actually collects the item)
					await onEntityClick(hoveredEntity.entityType, hoveredEntity.id, {
						collect: true,
					})
				}
			}
		}

		document.addEventListener('keypress', handleKeyPress)
		return () => document.removeEventListener('keypress', handleKeyPress)
	}, [hoveredEntity, onEntityClick])

	return (
		<div className='grid-container'>
			{/* Child Location Navigation */}
			{childLocations.length > 0 && (
				<div className='child-location-navigation'>
					{currentChildLocationIndex > 0 && (
						<button
							className='nav-button nav-prev'
							onClick={() => onNavigateChildLocation?.('prev')}
							title='Previous location'
						>
							← Previous
						</button>
					)}
					<div className='location-indicator'>
						{childLocations[currentChildLocationIndex]?.name ||
							'Unknown Location'}
					</div>
					{currentChildLocationIndex < childLocations.length - 1 && (
						<button
							className='nav-button nav-next'
							onClick={() => onNavigateChildLocation?.('next')}
							title='Next location'
						>
							Next →
						</button>
					)}
				</div>
			)}

			<div className='grid'>
				{gridCells.map(({ x, y, entity, isInteractive }) => (
					<div
						key={`${x}-${y}`}
						className={`grid-cell ${entity ? 'has-entity' : ''} ${
							!isInteractive ? 'not-interactive' : ''
						} ${entity && entity.state === 'void' ? 'cleared' : ''} ${
							entity && entity.state === 'inventory' ? 'in-inventory' : ''
						}`}
						onClick={() => handleCellClick(x, y)}
						onMouseEnter={(e) => handleMouseEnter(entity, e)}
						onMouseMove={handleMouseMove}
						onMouseLeave={handleMouseLeave}
					>
						{entity && (
							<div className='entity'>
								<ImageDisplay
									src={getEntityImageUrl(entity.image)}
									alt={entity.name}
									className='entity-image'
									fallback={<div className='no-image'>?</div>}
								/>
								<div className='entity-name'>{entity.name}</div>
							</div>
						)}
					</div>
				))}
			</div>

			{/* Tooltip for hovered entity */}
			{hoveredEntity && (
				<div
					className='entity-tooltip'
					style={{
						position: 'fixed',
						left: `${mousePosition.x + 15}px`,
						top: `${mousePosition.y - 10}px`,
						pointerEvents: 'none',
						zIndex: 1000,
					}}
				>
					<div className='tooltip-content'>
						<strong>{hoveredEntity.name}</strong>
						<div className='tooltip-image'>
							<ImageDisplay
								src={getEntityImageUrl(hoveredEntity.image)}
								alt={hoveredEntity.name}
								style={{ width: '50px', height: '50px' }}
								fallback={<div className='no-image'>?</div>}
							/>
						</div>
						{getInteractionHint(hoveredEntity) && (
							<div className='interaction-hint'>
								{getInteractionHint(hoveredEntity)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
