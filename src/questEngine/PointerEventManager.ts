import { Entity, InputAction, pointerEventsSystem, engine } from '@dcl/sdk/ecs'
import { EntityManager } from './EntityManager'
import { QuestEngine } from './QuestEngine'
import { InteractiveMode, EntityState } from '../../questEditor/models'

export class PointerEventManager {
  private entityManager: EntityManager
  private questEngine: QuestEngine
  private eventListeners: Map<string, any> = new Map()
  private debugMode: boolean = false

  constructor(entityManager: EntityManager, questEngine: QuestEngine, debugMode: boolean = false) {
    this.entityManager = entityManager
    this.questEngine = questEngine
    this.debugMode = debugMode
  }

  /**
   * Update pointer event listeners for an entity based on its current state
   */
  updateEntityPointerEvents(entityId: string): void {
    const entity = this.entityManager.getEntityMap().get(entityId)
    if (!entity) return

    // Remove existing listener if any
    this.removePointerListener(entityId)

    // Get current entity state from quest engine
    const gameState = this.questEngine.getGameState()
    const currentLocation = gameState.locations.find((l) => l.id === gameState.currentLocationId)

    if (!currentLocation) return

    // Find the item, npc, or portal
    let questEntity =
      currentLocation.items.find((i) => i.id === entityId) ||
      currentLocation.npcs.find((n) => n.id === entityId) ||
      currentLocation.portals.find((p) => p.id === entityId)

    // Check global entities if not found in current location
    if (!questEntity) {
      questEntity =
        gameState.items.find((i) => i.id === entityId) ||
        gameState.npcs.find((n) => n.id === entityId) ||
        gameState.portals.find((p) => p.id === entityId)
    }

    if (!questEntity) return

    // Only add listeners for entities in World state
    if (questEntity.state !== EntityState.World) return

    // Handle different entity types
    // NPCs are always interactive (for dialogue)
    if ('onInteract' in questEntity && questEntity.id.includes('npc')) {
      this.addPointerListener(entityId, entity, questEntity)
    }
    // Items and portals with interactive or grabbable modes
    else if (
      'interactive' in questEntity &&
      (questEntity.interactive === InteractiveMode.Interactive || questEntity.interactive === InteractiveMode.Grabbable)
    ) {
      console.log(
        `🎯 PointerEventManager: Setting up pointer listener for ${entityId} (${questEntity.name}) - interactive: ${questEntity.interactive}`
      )
      this.addPointerListener(entityId, entity, questEntity)
    }
    // Non-interactive entities
    else if ('interactive' in questEntity && questEntity.interactive === InteractiveMode.NotInteractive) {
      this.removePointerListener(entityId)
    }
  }

  private addPointerListener(entityId: string, entity: Entity, questEntity: any): void {
    if (this.eventListeners.has(entityId)) return

    const listener = pointerEventsSystem.onPointerDown(
      {
        entity: entity,
        opts: {
          button: InputAction.IA_POINTER,
          hoverText: questEntity.name || 'Interact'
        }
      },
      () => {
        console.log(`🎯 PointerEventManager: Pointer event triggered for entity: ${entityId} (${questEntity.name})`)

        // Determine interaction type and process it
        let interactionType = 'clickItem'
        if (entityId.includes('npc') || questEntity.id.includes('npc')) {
          interactionType = 'clickNPC'
        } else if (questEntity.destinationLocationId) {
          interactionType = 'clickPortal'
        }

        const commands = this.questEngine.processInteraction(interactionType, { id: entityId })
        console.log(
          `🔄 PointerEventManager: About to execute ${commands.length} commands for ${interactionType} on ${entityId}`
        )
        this.questEngine.executeCommands(commands)
        console.log(`✅ PointerEventManager: Finished executing commands for ${interactionType} on ${entityId}`)
      }
    )

    this.eventListeners.set(entityId, listener)

    if (this.debugMode) {
      console.log(`Added pointer listener for ${entityId} (${questEntity.name})`)
    }
  }

  private removePointerListener(entityId: string): void {
    const listener = this.eventListeners.get(entityId)
    if (listener) {
      pointerEventsSystem.removeOnPointerDown(listener)
      this.eventListeners.delete(entityId)

      if (this.debugMode) {
        console.log(`Removed pointer listener for ${entityId}`)
      }
    }
  }

  /**
   * Update all entities in the current location
   */
  updateAllPointerEvents(): void {
    const gameState = this.questEngine.getGameState()
    const currentLocation = gameState.locations.find((l) => l.id === gameState.currentLocationId)

    if (!currentLocation) return // Update all entities in current location
    ;[...currentLocation.items, ...currentLocation.npcs, ...currentLocation.portals].forEach((entity) => {
      this.updateEntityPointerEvents(entity.id)
    })

    // Update global entities if they're in world state
    ;[...gameState.items, ...gameState.npcs, ...gameState.portals]
      .filter((entity) => entity.state === EntityState.World)
      .forEach((entity) => {
        this.updateEntityPointerEvents(entity.id)
      })
  }

  /**
   * Clean up all listeners (call this when switching locations or shutting down)
   */
  cleanup(): void {
    for (const [entityId, listener] of this.eventListeners) {
      pointerEventsSystem.removeOnPointerDown(listener)
    }
    this.eventListeners.clear()
  }
}
