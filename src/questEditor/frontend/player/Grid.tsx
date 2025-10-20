import React, { useMemo, useState } from 'react'

interface GridProps {
  onEntityClick: (entityType: string, entityId: string) => void
  backgroundImage: string
  entities?: any[]
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

export const Grid: React.FC<GridProps> = ({ onEntityClick, backgroundImage, entities = [] }) => {
  const [hoveredEntity, setHoveredEntity] = useState<any>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  // Use the provided entities from the game state
  const gameEntities = useMemo(() => {
    // Create a stable grid representation
    // We'll maintain positions for all entities, even when they're not spawned
    const gridSize = 8
    const occupiedPositions = new Set<string>()

    // Helper function to find available position
    const findAvailablePosition = (random: () => number): { x: number; y: number } => {
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
          y: position.y
        })
      }
    })

    return processedEntities.map((entity) => ({
      ...entity,
      // Map entity type for click handler
      entityType: entity.type === 'item' ? 'Item' : entity.type === 'npc' ? 'NPC' : 'Portal'
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
          isInteractive: entity ? entity.interactive !== 'notInteractive' : false
        })
      }
    }
    return cells
  }, [gameEntities])

  const handleCellClick = (x: number, y: number) => {
    const entity = gameEntities.find((e) => e.x === x && e.y === y)
    if (entity) {
      onEntityClick(entity.entityType, entity.id)
    }
  }

  const handleMouseEnter = (entity: any, e: React.MouseEvent) => {
    if (entity) {
      setHoveredEntity(entity)
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
  }

  const handleMouseLeave = () => {
    setHoveredEntity(null)
  }

  return (
    <div className="grid-container">
      <div className="grid">
        {gridCells.map(({ x, y, entity, isInteractive }) => (
          <div
            key={`${x}-${y}`}
            className={`grid-cell ${entity ? 'has-entity' : ''} ${!isInteractive ? 'not-interactive' : ''} ${entity && entity.state === 'void' ? 'cleared' : ''} ${entity && entity.state === 'inventory' ? 'in-inventory' : ''}`}
            onClick={() => handleCellClick(x, y)}
            onMouseEnter={(e) => handleMouseEnter(entity, e)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {entity && (
              <div className="entity">
                <img src={entity.image} alt={entity.name} title={entity.name} className="entity-image" />
                <div className="entity-name">{entity.name}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tooltip for hovered entity */}
      {hoveredEntity && (
        <div
          className="entity-tooltip"
          style={{
            position: 'fixed',
            left: `${mousePosition.x + 15}px`,
            top: `${mousePosition.y - 10}px`,
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <div className="tooltip-content">
            <strong>{hoveredEntity.name}</strong>
            <div className="tooltip-image">
              <img src={hoveredEntity.image} alt={hoveredEntity.name} style={{ width: '50px', height: '50px' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
