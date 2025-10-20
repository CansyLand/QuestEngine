// src/questEngine/QuestEngine.ts - Adapted from gameEditor/backend/engine.ts for Decentraland

import {
  Game,
  Location,
  Quest,
  QuestStep,
  NPC,
  Item,
  Portal,
  Action,
  ActionType,
  Command,
  InteractiveMode,
  EntityState
} from '../../questEditor/models.js'
import { QuestPersistence, QuestCommand, QuestCommandType } from './types'
import { EMBEDDED_NPCS } from './data'
import { getDecentralandName } from './entityMappings'
import { SceneController } from './SceneController'
import { LocationAdapter } from './LocationAdapter'
import { EntityManager } from './EntityManager'
import { PointerEventManager } from './PointerEventManager'
import { initializeExistingEntity, talk, NPCType } from './npcToolkit'
import { npcDataComponent, activeNPC, clearNPC } from './npcToolkit/npc'
import { npcDialogComponent } from './npcToolkit/dialog'
import { engine } from '@dcl/sdk/ecs'

export class QuestEngine {
  private game: Game
  private persistence: QuestPersistence
  private sceneController: SceneController
  private locationAdapter: LocationAdapter
  private pointerEventManager: PointerEventManager
  private debugMode: boolean = false

  constructor(persistence: QuestPersistence, sceneController: SceneController, debugMode: boolean = false) {
    this.persistence = persistence
    this.sceneController = sceneController
    this.debugMode = debugMode
    this.game = this.persistence.loadGame()

    // Initialize location adapter with entity manager from scene controller and quest engine reference
    this.locationAdapter = new LocationAdapter(sceneController.getEntityManager(), this, debugMode)

    // Initialize pointer event manager
    this.pointerEventManager = new PointerEventManager(sceneController.getEntityManager(), this, debugMode)

    // Reset cleared states for a fresh game session
    this.resetClearedStates()
  }

  private resetClearedStates(): void {
    // Reset all entities to their initial states for a fresh game session
    // Entities in inventory stay in inventory, consumed entities stay consumed
    // But we need to reset any temporary state changes
    // For now, keep entities in their defined states
  }

  // Reset game to initial state
  reset(): QuestCommand[] {
    // Reset cleared states
    this.resetClearedStates()

    // Reset inventory - return all items to their initial states
    this.game.inventory.forEach((entityId) => {
      this.setEntityState(entityId, EntityState.Void)
    })
    this.game.inventory = []

    // Reset active quests
    this.game.activeQuests = []
    this.game.quests.forEach((quest) => {
      quest.completed = false
      quest.activeStepId = undefined
      quest.steps.forEach((step) => {
        step.isCompleted = false
      })
    })

    // Reset custom objective counters
    this.game.seedsPlaced = 0

    // Return commands to initialize the reset game state
    return this.start()
  }

  // Initialize game with starting state
  start(): QuestCommand[] {
    const commands: QuestCommand[] = []

    // Set initial location
    if (this.game.currentLocationId) {
      commands.push(...this.changeLocation(this.game.currentLocationId))
    }

    // Activate starting quests (those with order 0 or prerequisites met)
    const startingQuests = this.game.quests.filter((quest) => quest.order === 0)
    startingQuests.forEach((quest) => {
      commands.push(...this.activateQuest(quest.id))
    })

    // Initialize pointer events after location is set
    this.pointerEventManager.updateAllPointerEvents()

    return commands
  }

  // Change to a specific location programmatically
  changeToLocation(locationId: string): QuestCommand[] {
    return this.changeLocation(locationId)
  }

  // Process player interactions
  processInteraction(type: string, params: any): QuestCommand[] {
    if (this.debugMode) {
      console.log(`Processing interaction: ${type} with params:`, params)
    }
    const commands: QuestCommand[] = []

    switch (type) {
      case 'clickItem':
        if (this.debugMode) {
          console.log(`Handling item interaction for ${params.id}`)
        }
        commands.push(...this.handleItemInteraction(params.id))
        break
      case 'clickNPC':
        if (this.debugMode) {
          console.log(`Handling NPC interaction for ${params.id}`)
        }
        commands.push(...this.handleNPCInteraction(params.id))
        break
      case 'clickPortal':
        if (this.debugMode) {
          console.log(`Handling portal interaction for ${params.id}`)
        }
        commands.push(...this.handlePortalInteraction(params.id))
        break
      default:
        console.log(`Unknown interaction type: ${type}`)
    }

    if (this.debugMode) {
      console.log(`Returning commands:`, commands)
    }
    return commands
  }

  private handleItemInteraction(itemId: string): QuestCommand[] {
    const commands: QuestCommand[] = []
    const currentLocation = this.getCurrentLocation()

    if (!currentLocation) return commands

    const item = currentLocation.items.find((i) => i.id === itemId)
    if (!item || item.state !== EntityState.World) return commands

    // Play interaction audio if specified
    if (item.audioOnInteraction) {
      commands.push({
        type: QuestCommandType.PlaySound,
        params: { url: item.audioOnInteraction }
      })
    }

    // Execute onInteract actions
    item.onInteract.forEach((action) => {
      commands.push(...this.executeAction(action))
    })

    // Handle specific interaction modes
    if (item.interactive === InteractiveMode.Grabbable) {
      // Add to inventory and remove from world
      commands.push(...this.addToInventory(itemId))

      // Play grab audio
      if (item.audioOnGrab) {
        commands.push({
          type: QuestCommandType.PlaySound,
          params: { url: item.audioOnGrab }
        })
      }
    }

    // Check quest objectives
    commands.push(...this.checkObjectives())

    return commands
  }

  private handleNPCInteraction(npcId: string): QuestCommand[] {
    if (this.debugMode) {
      console.log(`handleNPCInteraction called for ${npcId}`)
    }
    const commands: QuestCommand[] = []
    const currentLocation = this.getCurrentLocation()

    if (!currentLocation) {
      if (this.debugMode) {
        console.log(`No current location found`)
      }
      return commands
    }

    if (this.debugMode) {
      console.log(
        `Current location: ${currentLocation.id}, npcs:`,
        currentLocation.npcs.map((n) => n.id)
      )
    }
    const npc = currentLocation.npcs.find((n) => n.id === npcId)
    if (!npc) {
      if (this.debugMode) {
        console.log(`NPC ${npcId} not found in current location`)
      }
      return commands
    }
    if (npc.state !== EntityState.World) {
      if (this.debugMode) {
        console.log(`NPC ${npcId} state is ${npc.state}, not World`)
      }
      return commands
    }

    if (this.debugMode) {
      console.log(`NPC found, looking for dialogue...`)
    }
    // Find appropriate dialogue sequence
    const dialogueSequence = this.findDialogueForNPC(npcId)
    if (this.debugMode) {
      console.log(`Found dialogue sequence:`, dialogueSequence ? dialogueSequence.id : 'none')
    }
    if (dialogueSequence) {
      // Get the actual npcToolkit NPC entity using correct name from mappings
      const npcEntityName = getDecentralandName(npcId)
      if (!npcEntityName) {
        if (this.debugMode) {
          console.log(`No entity mapping found for NPC: ${npcId}`)
        }
        return commands
      }

      if (this.debugMode) {
        console.log(`Looking for NPC entity: ${npcEntityName} for dialogue with ${npcId}`)
      }
      const npcEntity = engine.getEntityOrNullByName(npcEntityName)
      if (npcEntity) {
        // ✅ Use npcToolkit's talk function to show dialogue dynamically
        // No need to recreate NPC components - just change the dialogue!
        talk(npcEntity, dialogueSequence.dialogs, 0)

        if (this.debugMode) {
          console.log(`Started NPC dialogue for ${npcId}: ${dialogueSequence.id}`)
        }
      } else if (this.debugMode) {
        console.log(`NPC entity not found: ${npcEntityName} for ${npcId}`)
      }
    } else if (this.debugMode) {
      console.log(`No dialogue sequence found for NPC ${npcId}`)
    }

    // Execute onInteract actions
    if (npc.onInteract) {
      if (this.debugMode) {
        console.log(`Executing NPC onInteract actions:`, npc.onInteract)
      }
      npc.onInteract.forEach((action) => {
        if (this.debugMode) {
          console.log(`Executing action:`, action)
        }
        commands.push(...this.executeAction(action))
      })
    }

    // Check quest objectives (talkTo type)
    commands.push(...this.checkObjectives(npcId))

    return commands
  }

  private handlePortalInteraction(portalId: string): QuestCommand[] {
    if (this.debugMode) {
      console.log(`handlePortalInteraction called for ${portalId}`)
    }
    const commands: QuestCommand[] = []
    const currentLocation = this.getCurrentLocation()

    if (!currentLocation) {
      if (this.debugMode) {
        console.log(`No current location found`)
      }
      return commands
    }

    if (this.debugMode) {
      console.log(
        `Current location: ${currentLocation.id}, portals:`,
        currentLocation.portals.map((p) => p.id)
      )
    }
    const portal = currentLocation.portals.find((p) => p.id === portalId)
    if (!portal) {
      if (this.debugMode) {
        console.log(`Portal ${portalId} not found in current location`)
      }
      return commands
    }
    if (portal.state !== EntityState.World) {
      if (this.debugMode) {
        console.log(`Portal ${portalId} state is ${portal.state}, not World`)
      }
      return commands
    }

    if (this.debugMode) {
      console.log(`Portal found, executing onInteract actions:`, portal.onInteract)
    }
    // Execute onInteract actions (should include ChangeLocation)
    portal.onInteract.forEach((action) => {
      if (this.debugMode) {
        console.log(`Executing action:`, action)
      }
      commands.push(...this.executeAction(action))
    })

    // Check quest objectives after location change
    commands.push(...this.checkObjectives())

    return commands
  }

  private executeAction(action: Action): QuestCommand[] {
    const commands: QuestCommand[] = []

    switch (action.type) {
      case ActionType.PlaySound:
        commands.push({
          type: QuestCommandType.PlaySound,
          params: { url: action.params.url }
        })
        break

      case ActionType.AddToInventory:
        commands.push(...this.addToInventory(action.params.entityId))
        break

      case ActionType.RemoveFromInventory:
        commands.push(...this.removeFromInventory(action.params.entityId))
        break

      case ActionType.RemoveFromInventoryByName:
        commands.push(...this.removeFromInventoryByName(action.params.itemName, action.params.count))
        break

      case ActionType.GrantToInventory:
        commands.push(...this.grantToInventory(action.params.entityId))
        break

      case ActionType.SetInteractive:
        commands.push(...this.setInteractive(action.params.entityId, action.params.interactiveMode))
        break

      case ActionType.SetInteractiveByName:
        commands.push(...this.setInteractiveByName(action.params.itemName, action.params.interactiveMode))
        break

      case ActionType.SpawnEntity:
        // In Decentraland, we make the entity visible and interactive
        console.log(`🔄 Spawning entity: ${action.params.entityId}`)
        commands.push({
          type: QuestCommandType.SetEntityVisibility,
          params: { entityId: action.params.entityId, visible: true }
        })
        commands.push({
          type: QuestCommandType.AddGltfComponent,
          params: { entityId: action.params.entityId }
        })
        this.setEntityState(action.params.entityId, EntityState.World)
        // Update pointer events for the newly spawned entity
        this.pointerEventManager.updateEntityPointerEvents(action.params.entityId)
        console.log(`✅ Spawn entity command created for: ${action.params.entityId}`)
        break

      case ActionType.ClearEntity:
        // In Decentraland, we hide the entity and make it non-interactive
        commands.push({
          type: QuestCommandType.SetEntityVisibility,
          params: { entityId: action.params.entityId, visible: false }
        })
        this.setEntityState(action.params.entityId, EntityState.Void)
        break

      case ActionType.ActivateQuest:
        commands.push(...this.activateQuest(action.params.questId))
        break

      case ActionType.AdvanceStep:
        commands.push(...this.advanceStep())
        break

      case ActionType.ChangeLocation:
        commands.push(...this.changeLocation(action.params.locationId))
        break

      case ActionType.StartDialogue:
        commands.push({
          type: QuestCommandType.ShowDialogue,
          params: { dialogueSequenceId: action.params.dialogueSequenceId }
        })
        break

      default:
        // Handle custom actions
        if (action.type === 'custom') {
          switch (action.params.action) {
            case 'place_seed':
              commands.push(...this.handlePlaceSeed(action.params.vesselId))
              break
            // Add other custom actions here as needed
            default:
              console.log(`Unknown custom action: ${action.params.action}`)
          }
        } else {
          console.log(`Unknown action type: ${action.type}`)
        }
    }

    return commands
  }

  private handlePlaceSeed(vesselId: string): QuestCommand[] {
    const commands: QuestCommand[] = []

    // Check if player has a pomegranate seed in inventory
    const seedInInventory = this.game.inventory.find((entityId) => {
      const entity = this.findEntityById(entityId)
      return entity && entity.name === 'Pomegranate Seed'
    })

    if (seedInInventory) {
      // Remove seed from inventory
      commands.push(...this.removeFromInventoryByName('Pomegranate Seed', 1))

      // Update vessel appearance (this would be handled by your scene logic)
      // For now, we'll just log it
      commands.push({
        type: QuestCommandType.Log,
        params: { message: `Placed pomegranate seed in ${vesselId}` }
      })

      // Make the vessel non-interactive after placement
      commands.push(...this.setInteractive(vesselId, InteractiveMode.NotInteractive))

      // Increment seeds placed counter
      this.game.seedsPlaced = (this.game.seedsPlaced || 0) + 1

      // Check objectives after placement
      commands.push(...this.checkObjectives())
    } else {
      // No seed in inventory
      commands.push({
        type: QuestCommandType.Log,
        params: { message: 'You need a pomegranate seed to activate this vessel' }
      })
    }

    return commands
  }

  private addToInventory(entityId: string): QuestCommand[] {
    if (!this.game.inventory.includes(entityId)) {
      this.game.inventory.push(entityId)
      this.setEntityState(entityId, EntityState.Inventory)
      // Update pointer events since entity is no longer in world
      this.pointerEventManager.updateEntityPointerEvents(entityId)
    }
    return [
      {
        type: QuestCommandType.UpdateInventory,
        params: { inventory: [...this.game.inventory] }
      },
      // Hide the entity from the world when added to inventory
      {
        type: QuestCommandType.SetEntityVisibility,
        params: { entityId, visible: false }
      },
      // Remove GLTF component to save resources
      {
        type: QuestCommandType.RemoveGltfComponent,
        params: { entityId }
      }
    ]
  }

  private removeFromInventory(entityId: string): QuestCommand[] {
    const index = this.game.inventory.indexOf(entityId)
    if (index > -1) {
      this.game.inventory.splice(index, 1)
      // Entity state will be set by the calling context (e.g., to World or Void)
    }
    return [
      {
        type: QuestCommandType.UpdateInventory,
        params: { inventory: [...this.game.inventory] }
      }
    ]
  }

  private removeFromInventoryByName(itemName: string, count: number): QuestCommand[] {
    // Find entities in inventory that match the name
    const entitiesToRemove: string[] = []
    let removedCount = 0

    for (const entityId of this.game.inventory) {
      if (removedCount >= count) break

      const entity = this.findEntityById(entityId)
      if (entity && entity.name === itemName) {
        entitiesToRemove.push(entityId)
        removedCount++
      }
    }

    // Remove the entities from inventory
    for (const entityId of entitiesToRemove) {
      const index = this.game.inventory.indexOf(entityId)
      if (index > -1) {
        this.game.inventory.splice(index, 1)
        // Set entity state to Void (consumed)
        this.setEntityState(entityId, EntityState.Void)
      }
    }

    return [
      {
        type: QuestCommandType.UpdateInventory,
        params: { inventory: [...this.game.inventory] }
      }
    ]
  }

  private grantToInventory(entityId: string): QuestCommand[] {
    if (!this.game.inventory.includes(entityId)) {
      this.game.inventory.push(entityId)
      this.setEntityState(entityId, EntityState.Inventory)
    }
    return [
      {
        type: QuestCommandType.UpdateInventory,
        params: { inventory: [...this.game.inventory] }
      }
    ]
  }

  private setInteractive(entityId: string, interactiveMode: InteractiveMode): QuestCommand[] {
    // Find and update entity interactivity across all locations
    for (const location of this.game.locations) {
      const item = location.items.find((i) => i.id === entityId)
      if (item) {
        item.interactive = interactiveMode
        break
      }

      const portal = location.portals.find((p) => p.id === entityId)
      if (portal) {
        portal.interactive = interactiveMode
        break
      }

      // NPCs are always interactive (for talking), so we don't change their interactivity
      const npc = location.npcs.find((n) => n.id === entityId)
      if (npc) {
        // NPCs don't have an interactive property - they're always interactive
        break
      }
    }

    // Also check global entities
    const globalItem = this.game.items.find((i) => i.id === entityId)
    if (globalItem) {
      globalItem.interactive = interactiveMode
    }

    const globalPortal = this.game.portals.find((p) => p.id === entityId)
    if (globalPortal) {
      globalPortal.interactive = interactiveMode
    }

    // Update pointer events for this entity
    this.pointerEventManager.updateEntityPointerEvents(entityId)

    // Return command to update entity in scene
    return [
      {
        type: QuestCommandType.Log,
        params: { message: `Updated interactivity for ${entityId} to ${interactiveMode}` }
      }
    ]
  }

  private setInteractiveByName(itemName: string, interactiveMode: InteractiveMode): QuestCommand[] {
    const updatedEntityIds: string[] = []

    // Update all items with matching name across all locations
    for (const location of this.game.locations) {
      location.items.forEach((item) => {
        if (item.name === itemName) {
          item.interactive = interactiveMode
          updatedEntityIds.push(item.id)
        }
      })

      // Portals can also be updated by name
      location.portals.forEach((portal) => {
        if (portal.name === itemName) {
          portal.interactive = interactiveMode
          updatedEntityIds.push(portal.id)
        }
      })
    }

    // Also check global entities
    this.game.items.forEach((item) => {
      if (item.name === itemName) {
        item.interactive = interactiveMode
        if (!updatedEntityIds.includes(item.id)) {
          updatedEntityIds.push(item.id)
        }
      }
    })

    this.game.portals.forEach((portal) => {
      if (portal.name === itemName) {
        portal.interactive = interactiveMode
        if (!updatedEntityIds.includes(portal.id)) {
          updatedEntityIds.push(portal.id)
        }
      }
    })

    // Return commands for each updated entity
    return updatedEntityIds.map((entityId) => ({
      type: QuestCommandType.Log,
      params: { message: `Updated interactivity for ${entityId} to ${interactiveMode}` }
    }))
  }

  public activateQuest(questId: string): QuestCommand[] {
    const commands: QuestCommand[] = []
    const quest = this.game.quests.find((q) => q.id === questId)

    if (!quest || this.game.activeQuests.includes(questId) || quest.completed) {
      return commands
    }

    this.game.activeQuests.push(questId)
    quest.activeStepId = quest.steps[0]?.id

    // Execute onStart actions for first step
    if (quest.steps[0]) {
      quest.steps[0].onStart.forEach((action) => {
        commands.push(...this.executeAction(action))
      })
    }

    commands.push({
      type: QuestCommandType.QuestActivated,
      params: { questId, questTitle: quest.title }
    })

    return commands
  }

  private advanceStep(): QuestCommand[] {
    const commands: QuestCommand[] = []

    // Find current active quest and step
    for (const questId of this.game.activeQuests) {
      const quest = this.game.quests.find((q) => q.id === questId)
      if (!quest || quest.completed) continue

      const currentStepIndex = quest.steps.findIndex((s) => s.id === quest.activeStepId)
      if (currentStepIndex === -1) continue

      const currentStep = quest.steps[currentStepIndex]

      // Execute onComplete actions
      currentStep.onComplete.forEach((action) => {
        commands.push(...this.executeAction(action))
      })

      // Mark step as completed
      currentStep.isCompleted = true

      // Move to next step or complete quest
      if (currentStepIndex < quest.steps.length - 1) {
        const nextStep = quest.steps[currentStepIndex + 1]
        quest.activeStepId = nextStep.id

        // Execute onStart actions for next step
        nextStep.onStart.forEach((action) => {
          commands.push(...this.executeAction(action))
        })

        commands.push({
          type: QuestCommandType.Log,
          params: { message: `Quest step completed: ${currentStep.name}. Next: ${nextStep.name}` }
        })
      } else {
        // Quest completed
        quest.completed = true
        this.game.activeQuests = this.game.activeQuests.filter((id) => id !== questId)
        commands.push({
          type: QuestCommandType.QuestCompleted,
          params: { questId, questTitle: quest.title }
        })
      }

      break // Only advance one step at a time
    }

    return commands
  }

  private startDialogue(dialogueSequenceId: string): QuestCommand[] {
    const commands: QuestCommand[] = []

    // Find the dialogue sequence
    const dialogueSequence = this.game.dialogues.find((d) => d.id === dialogueSequenceId)
    if (!dialogueSequence) {
      console.log(`Dialogue sequence ${dialogueSequenceId} not found`)
      return commands
    }

    // Start the dialogue automatically
    const params: any = {
      dialogueSequenceId: dialogueSequenceId
    }

    // Only include npcId if it exists
    if (dialogueSequence.npcId) {
      params.npcId = dialogueSequence.npcId
    }

    commands.push({
      type: QuestCommandType.ShowDialogue,
      params: params
    })

    return commands
  }

  private changeLocation(locationId: string): QuestCommand[] {
    const commands: QuestCommand[] = []
    const newLocation = this.game.locations.find((l) => l.id === locationId)

    if (!newLocation) return commands

    // Update current location
    this.game.currentLocationId = locationId

    // Use LocationAdapter to manage entity visibility for location transitions
    commands.push(...this.locationAdapter.changeLocation(newLocation))

    // Update pointer events for the new location
    this.pointerEventManager.updateAllPointerEvents()

    return commands
  }

  private checkObjectives(interactedNpcId?: string): QuestCommand[] {
    const commands: QuestCommand[] = []

    for (const questId of this.game.activeQuests) {
      const quest = this.game.quests.find((q) => q.id === questId)
      if (!quest || quest.completed) continue

      const currentStep = quest.steps.find((s) => s.id === quest.activeStepId)
      if (!currentStep) continue

      let objectiveCompleted = false

      switch (currentStep.objectiveType) {
        case 'collectEntities':
          const { entityIds } = currentStep.objectiveParams
          if (entityIds && entityIds.every((id: string) => this.game.inventory.includes(id))) {
            objectiveCompleted = true
          }
          break

        case 'collectByName':
          const { itemName, count = 1 } = currentStep.objectiveParams
          if (itemName) {
            // Count how many items with this name are in inventory
            const matchingItems = this.game.inventory.filter((entityId) => {
              // Find the entity and check if its name matches
              const entity = this.findEntityById(entityId)
              return entity && entity.name === itemName
            })
            if (matchingItems.length >= count) {
              objectiveCompleted = true
            }
          }
          break

        case 'talkTo':
          // Check if this is the NPC that was just interacted with
          if (interactedNpcId && currentStep.objectiveParams.npcId === interactedNpcId) {
            objectiveCompleted = true
          }
          break

        case 'interact':
          // Custom interaction logic
          break

        case 'custom':
          const { targetId, requiredCount } = currentStep.objectiveParams
          if (targetId === 'seeds_placed') {
            objectiveCompleted = (this.game.seedsPlaced || 0) >= (requiredCount || 5)
          }
          break

        case 'goToLocation':
          const { locationId } = currentStep.objectiveParams
          if (this.game.currentLocationId === locationId) {
            objectiveCompleted = true
          }
          break
      }

      if (objectiveCompleted) {
        commands.push(...this.advanceStep())
      }
    }

    return commands
  }

  private setEntityState(entityId: string, state: EntityState): void {
    // Find and update entity across all locations
    for (const location of this.game.locations) {
      const item = location.items.find((i) => i.id === entityId)
      if (item) {
        item.state = state
        return
      }

      const npc = location.npcs.find((n) => n.id === entityId)
      if (npc) {
        npc.state = state
        return
      }

      const portal = location.portals.find((p) => p.id === entityId)
      if (portal) {
        portal.state = state
        return
      }
    }

    // Also check global entities
    const globalItem = this.game.items.find((i) => i.id === entityId)
    if (globalItem) {
      globalItem.state = state
      return
    }

    const globalNpc = this.game.npcs.find((n) => n.id === entityId)
    if (globalNpc) {
      globalNpc.state = state
      return
    }

    const globalPortal = this.game.portals.find((p) => p.id === entityId)
    if (globalPortal) {
      globalPortal.state = state
      return
    }
  }

  private findDialogueForNPC(npcId: string): any {
    // Find active quest steps that involve this NPC
    const relevantQuestSteps: string[] = []

    for (const questId of this.game.activeQuests) {
      const quest = this.game.quests.find((q) => q.id === questId)
      if (!quest || quest.completed) continue

      const currentStep = quest.steps.find((s) => s.id === quest.activeStepId)
      if (!currentStep) continue

      // Check if this step has dialogues associated with this NPC
      // Either it's a talkTo step, or there's a dialogue with this questStepId for this NPC
      if (currentStep.objectiveType === 'talkTo' && currentStep.objectiveParams.npcId === npcId) {
        relevantQuestSteps.push(currentStep.id)
      } else {
        // Check if there's a dialogue for this quest step and NPC
        const dialogueExists = this.game.dialogues.some((d) => d.npcId === npcId && d.questStepId === currentStep.id)
        if (dialogueExists) {
          relevantQuestSteps.push(currentStep.id)
        }
      }
    }

    // Look for dialogue sequences that match NPC and quest step
    for (const questStepId of relevantQuestSteps) {
      const dialogue = this.game.dialogues.find((d) => d.npcId === npcId && d.questStepId === questStepId)
      if (dialogue) {
        return dialogue
      }
    }

    // If no specific dialogue found, look for default dialogue in "npcId_default" format
    const defaultDialogueId = `${npcId}_default`
    const defaultDialogue = this.game.dialogues.find((d) => d.id === defaultDialogueId)
    if (defaultDialogue) {
      return defaultDialogue
    }

    // Fallback: look for any dialogue with questStepId: null for this NPC
    const fallbackDialogue = this.game.dialogues.find((d) => d.npcId === npcId && d.questStepId === null)
    if (fallbackDialogue) {
      return fallbackDialogue
    }

    return null
  }

  private findEntityById(entityId: string): Item | NPC | Portal | undefined {
    // Search in all locations
    for (const location of this.game.locations) {
      const item = location.items.find((i) => i.id === entityId)
      if (item) return item

      const npc = location.npcs.find((n) => n.id === entityId)
      if (npc) return npc

      const portal = location.portals.find((p) => p.id === entityId)
      if (portal) return portal
    }

    // Search in global entities
    const globalItem = this.game.items.find((i) => i.id === entityId)
    if (globalItem) return globalItem

    const globalNpc = this.game.npcs.find((n) => n.id === entityId)
    if (globalNpc) return globalNpc

    const globalPortal = this.game.portals.find((p) => p.id === entityId)
    if (globalPortal) return globalPortal

    return undefined
  }

  private getCurrentLocation(): Location | undefined {
    return this.game.locations.find((l) => l.id === this.game.currentLocationId)
  }

  // Execute commands through the scene controller
  executeCommands(commands: QuestCommand[]): void {
    console.log(`🚀 QuestEngine: executeCommands called with ${commands.length} commands`)
    this.sceneController.executeCommands(commands)
    console.log(`🚀 QuestEngine: executeCommands finished`)
  }

  // Get current game state
  getGameState() {
    return { ...this.game }
  }

  // Save game state
  saveGame(): void {
    this.persistence.saveGame(this.game)
  }

  // Load game state
  loadGame(): void {
    this.game = this.persistence.loadGame()
  }

  // Get scene controller for external access
  getSceneController(): SceneController {
    return this.sceneController
  }

  // Get pointer event manager for external access
  getPointerEventManager(): PointerEventManager {
    return this.pointerEventManager
  }
}
