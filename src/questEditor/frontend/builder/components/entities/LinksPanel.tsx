import React, { useState, useEffect } from 'react'
import { Game, Item, NPC, Portal, Location } from '../../../../models'
import { EntityTooltip, TooltipEntityBase } from '../ui/EntityTooltip'

interface LinksPanelProps {
  gameData: Game
}

interface DclEntity {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  parent: number
  questEntityId: string | null
  parentName?: string
  parentId?: number
}

interface QuestEntity extends TooltipEntityBase {
  type: 'item' | 'npc' | 'portal' | 'location'
}

export const LinksPanel: React.FC<LinksPanelProps> = ({ gameData }) => {
  const [dclEntities, setDclEntities] = useState<DclEntity[]>([])
  const [unlinkedItems, setUnlinkedItems] = useState<QuestEntity[]>([])
  const [draggedItem, setDraggedItem] = useState<QuestEntity | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [hoveredEntity, setHoveredEntity] = useState<QuestEntity | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [parentFilter, setParentFilter] = useState<string>('all')
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'item' | 'npc' | 'portal' | 'location'>('all')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load DCL entities from entityLinks.json
  useEffect(() => {
    const loadDclEntities = async () => {
      try {
        const response = await fetch('/api/entityLinks')
        const data = await response.json()
        const entities: DclEntity[] = Object.entries(data).map(([id, entity]: [string, any]) => ({
          id,
          name: entity.name,
          position: entity.position,
          parent: entity.parent,
          questEntityId: entity.questEntityId,
          parentName: entity.parentName, // Assume backend provides this
          parentId: entity.parent
        }))
        setDclEntities(entities)
      } catch (error) {
        console.error('Failed to load DCL entities:', error)
      }
    }

    // Load initially
    loadDclEntities()

    // Set up polling to refresh data every 3 seconds
    const intervalId = setInterval(loadDclEntities, 3000)

    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  // Clear save status messages after timeout
  useEffect(() => {
    if (saveError) {
      const timer = setTimeout(() => setSaveError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [saveError])

  useEffect(() => {
    if (hasChanges && !isSaving && !saveError) {
      const timer = setTimeout(() => setHasChanges(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [hasChanges, isSaving, saveError])

  // Get unlinked quest items
  useEffect(() => {
    const items: QuestEntity[] =
      (gameData as any).items?.map((item: any) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        type: 'item'
      })) || []
    const npcs: QuestEntity[] =
      (gameData as any).npcs?.map((npc: any) => ({
        id: npc.id,
        name: npc.name,
        image: npc.image,
        type: 'npc'
      })) || []
    const portals: QuestEntity[] =
      (gameData as any).portals?.map((portal: any) => ({
        id: portal.id,
        name: portal.name,
        image: portal.image,
        type: 'portal'
      })) || []
    const locations: QuestEntity[] = gameData.locations.map((location: any) => ({
      id: location.id,
      name: location.name,
      image: location.image,
      type: 'location'
    }))

    const allQuestEntities = [...items, ...npcs, ...portals, ...locations]
    const linkedIds = new Set(dclEntities.map((e) => e.questEntityId).filter(Boolean))
    const unlinked = allQuestEntities.filter((entity) => !linkedIds.has(entity.id))
    setUnlinkedItems(unlinked)

    // Update parent tab count
    if ((window as any).updateUnlinkedCount) {
      ;(window as any).updateUnlinkedCount(unlinked.length)
    }
  }, [gameData, dclEntities])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: QuestEntity) => {
    e.dataTransfer.setData('text/plain', item.id)
    setDraggedItem(item)
    setDraggingItemId(item.id)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    // Delay clearing dragging state to ensure drop handlers have a chance to run first
    setTimeout(() => {
      setDraggingItemId(null)
    }, 100)
  }

  const handleDrop = async (e: React.DragEvent, dclEntityId: string) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('text/plain')
    if (!itemId) return

    setIsSaving(true)
    setSaveError(null)

    try {
      // Update entityLinks.json via API
      const response = await fetch(`/api/entityLinks/${dclEntityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questEntityId: itemId })
      })

      if (response.ok) {
        // First, unlink the item from any existing DCL entity
        setDclEntities((prev) =>
          prev.map((e) => {
            if (e.questEntityId === itemId) {
              return { ...e, questEntityId: null }
            }
            if (e.id === dclEntityId) {
              return { ...e, questEntityId: itemId }
            }
            return e
          })
        )
        setHasChanges(true)
        // Clear dragging state since the item is now properly linked
        setDraggingItemId(null)
      } else {
        const errorData = await response.json()
        setSaveError(`Failed to link entity: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to link entity:', error)
      setSaveError(`Failed to link entity: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setIsSaving(false)
    }
    setDraggedItem(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleMouseEnter = (entity: QuestEntity, e: React.MouseEvent) => {
    setHoveredEntity(entity)
    setMousePosition({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
  }

  const handleMouseLeave = () => {
    setHoveredEntity(null)
  }

  const handleUnlink = async (dclEntityId: string) => {
    setIsSaving(true)
    setSaveError(null)

    try {
      const response = await fetch(`/api/entityLinks/${dclEntityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questEntityId: null })
      })

      if (response.ok) {
        setDclEntities((prev) => prev.map((e) => (e.id === dclEntityId ? { ...e, questEntityId: null } : e)))
        setHasChanges(true)
      } else {
        const errorData = await response.json()
        setSaveError(`Failed to unlink entity: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to unlink entity:', error)
      setSaveError(`Failed to unlink entity: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const unlinkedCount = unlinkedItems.length

  // Get unique parents for filter options
  const uniqueParents = Array.from(
    new Set(
      dclEntities.map((entity) => {
        if (entity.parentName) return entity.parentName
        const parentEntity = dclEntities.find((parent) => parent.id === entity.parent.toString())
        return parentEntity ? parentEntity.name : entity.parent.toString()
      })
    )
  ).sort()

  // Filter entities based on selected parent
  const filteredEntities =
    parentFilter === 'all'
      ? dclEntities
      : dclEntities.filter((entity) => {
          if (entity.parentName) return entity.parentName === parentFilter
          const parentEntity = dclEntities.find((parent) => parent.id === entity.parent.toString())
          return (parentEntity ? parentEntity.name : entity.parent.toString()) === parentFilter
        })

  return (
    <div className="links-panel">
      <div className="links-left">
        <div className="dcl-header">
          <h3>DCL Entities ({filteredEntities.length})</h3>
          {isSaving && <div className="save-status saving">Saving...</div>}
          {saveError && <div className="save-status error">{saveError}</div>}
          {hasChanges && !isSaving && !saveError && <div className="save-status success">Changes saved</div>}
          <div className="parent-filter">
            <label htmlFor="parent-select">Filter by Parent:</label>
            <select id="parent-select" value={parentFilter} onChange={(e) => setParentFilter(e.target.value)}>
              <option value="all">Show All</option>
              {uniqueParents.map((parent) => (
                <option key={parent} value={parent}>
                  {parent}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="dcl-cards">
          {filteredEntities.map((entity) => (
            <div
              key={entity.id}
              className="dcl-card"
              onDrop={(e) => handleDrop(e, entity.id)}
              onDragOver={handleDragOver}
            >
              <div className="dcl-card-content">
                <div className="dcl-image-section">
                  {entity.questEntityId && entity.questEntityId !== draggingItemId ? (
                    <div
                      className="linked-item"
                      draggable
                      onDragStart={(e) => {
                        if (entity.questEntityId) {
                          e.dataTransfer.setData('text/plain', entity.questEntityId)
                          const draggedItemData: QuestEntity = {
                            id: entity.questEntityId,
                            name: entity.questEntityId,
                            image: getImageForEntity(entity.questEntityId, gameData),
                            type: 'item'
                          }
                          setDraggedItem(draggedItemData)

                          // Set drag image using the actual image element
                          const imgElement = e.currentTarget.querySelector('img') as HTMLImageElement
                          if (imgElement) {
                            e.dataTransfer.setDragImage(imgElement, imgElement.width / 2, imgElement.height / 2)
                          }

                          // Delay setting dragging state to allow drag image to be captured
                          setTimeout(() => {
                            setDraggingItemId(entity.questEntityId)
                          }, 0)
                        }
                      }}
                      onDragEnd={handleDragEnd}
                    >
                      <img src={getImageForEntity(entity.questEntityId, gameData)} alt={entity.questEntityId} />
                    </div>
                  ) : (
                    <div className="empty-drop-zone">
                      <span>Drop item here</span>
                    </div>
                  )}
                </div>
                <div className="dcl-info-section">
                  <div className="entity-name">
                    <strong>{entity.name}</strong>
                  </div>
                  <div className="entity-id">ID: {entity.id}</div>
                  <div className="entity-parent">
                    {(() => {
                      if (entity.parentName) {
                        return `Parent: ${entity.parentName}`
                      }
                      // Look up parent entity name by ID
                      const parentEntity = dclEntities.find((parent) => parent.id === entity.parent.toString())
                      return parentEntity ? `Parent: ${parentEntity.name}` : `Parent ID: ${entity.parent}`
                    })()}
                  </div>
                  {entity.questEntityId && (
                    <button className="unlink-button" onClick={() => handleUnlink(entity.id)}>
                      Unlink
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="links-right">
        <h3>Unlinked Items ({unlinkedCount})</h3>
        <div className="entity-tabs">
          <button className={`entity-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            All ({unlinkedCount})
          </button>
          <button className={`entity-tab ${activeTab === 'item' ? 'active' : ''}`} onClick={() => setActiveTab('item')}>
            Items ({unlinkedItems.filter((item) => item.type === 'item').length})
          </button>
          <button className={`entity-tab ${activeTab === 'npc' ? 'active' : ''}`} onClick={() => setActiveTab('npc')}>
            NPCs ({unlinkedItems.filter((item) => item.type === 'npc').length})
          </button>
          <button
            className={`entity-tab ${activeTab === 'portal' ? 'active' : ''}`}
            onClick={() => setActiveTab('portal')}
          >
            Portals ({unlinkedItems.filter((item) => item.type === 'portal').length})
          </button>
          <button
            className={`entity-tab ${activeTab === 'location' ? 'active' : ''}`}
            onClick={() => setActiveTab('location')}
          >
            Locations ({unlinkedItems.filter((item) => item.type === 'location').length})
          </button>
        </div>
        <EntityTooltip entity={hoveredEntity} position={mousePosition} visible={hoveredEntity !== null}>
          <div
            className="items-grid"
            onDrop={async (e) => {
              e.preventDefault()
              const draggedItemId = e.dataTransfer.getData('text/plain')
              if (draggedItemId) {
                // Find the DCL entity that has this item linked and unlink it
                const dclEntity = dclEntities.find((entity) => entity.questEntityId === draggedItemId)
                if (dclEntity) {
                  await handleUnlink(dclEntity.id)
                  setDraggingItemId(null) // Clear dragging state
                }
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.currentTarget.classList.add('drop-target')
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('drop-target')
            }}
          >
            {unlinkedItems
              .filter((item) => activeTab === 'all' || item.type === activeTab)
              .map((item) => (
                <div
                  key={item.id}
                  className="grid-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                  onMouseEnter={(e) => handleMouseEnter(item, e)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <img src={item.image} alt={item.name} />
                </div>
              ))}
          </div>
        </EntityTooltip>
      </div>
    </div>
  )
}

function getImageForEntity(entityId: string, gameData: Game): string {
  // Search through all entity types to find the matching entity
  const allEntities = [
    ...(gameData.items || []),
    ...(gameData.npcs || []),
    ...(gameData.portals || []),
    ...(gameData.locations || [])
  ]

  const entity = allEntities.find((entity) => entity.id === entityId)
  return entity?.image || '/assets/images/default.png'
}
