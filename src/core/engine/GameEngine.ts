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
	GridEntity,
	EntityState,
} from '../models/types'
import { PersistenceManager } from '../services/persistence/PersistenceManager'

export class GameEngine {
	private game!: Game // Definite assignment assertion - will be set by initializeGame()
	private persistence: PersistenceManager

	constructor(persistence: PersistenceManager) {
		this.persistence = persistence
		// Game will be loaded asynchronously via initializeGame()
	}

	async initializeGame(): Promise<void> {
		this.game = await this.persistence.loadGame()
		this.initializeActiveQuests()
		this.resetClearedStates()
	}

	private initializeActiveQuests(): void {
		// Initialize active quests based on quest states
		// A quest is active if it's not completed and has at least one incomplete step
		this.game.activeQuests = []

		this.game.quests.forEach((quest) => {
			if (!quest.completed) {
				// Check if the quest has any incomplete steps
				const hasIncompleteSteps = quest.steps.some((step) => !step.isCompleted)
				if (hasIncompleteSteps) {
					this.game.activeQuests.push(quest.id)

					// Set the active step to the first incomplete step
					const firstIncompleteStep = quest.steps.find(
						(step) => !step.isCompleted
					)
					if (firstIncompleteStep) {
						quest.activeStepId = firstIncompleteStep.id
					}
				}
			}
		})
	}

	private resetClearedStates(): void {
		// Reset all entities to their initial states for a fresh game session
		// Entities in inventory stay in inventory, consumed entities stay consumed
		// But we need to reset any temporary state changes
		// For now, keep entities in their defined states
		// This method might need to be updated based on game requirements
	}

	// Reset game to initial state
	reset(): Command[] {
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

		// Reset to initial location if it exists (keep the current location as the starting point)
		// The currentLocationId should already be set from the loaded game data

		// Reset custom objective counters
		this.game.seedsPlaced = 0

		// Return commands to initialize the reset game state
		return this.start()
	}

	// Initialize game with starting state
	start(): Command[] {
		const commands: Command[] = []

		// Set initial location
		if (this.game.currentLocationId) {
			commands.push(...this.changeLocation(this.game.currentLocationId))
		}

		// Execute onStart actions for current steps of active quests
		this.game.activeQuests.forEach((questId) => {
			const quest = this.game.quests.find((q) => q.id === questId)
			if (quest && quest.activeStepId) {
				const currentStep = quest.steps.find((s) => s.id === quest.activeStepId)
				if (currentStep && currentStep.onStart) {
					currentStep.onStart.forEach((action) => {
						commands.push(...this.executeAction(action))
					})
				}
			}
		})

		// Send initial quest progress update
		commands.push(...this.sendQuestProgressUpdate())

		return commands
	}

	// Process player interactions
	processInteraction(type: string, params: any): Command[] {
		console.log(`Processing interaction: ${type} with params:`, params)
		const commands: Command[] = []

		switch (type) {
			case 'clickItem':
				console.log(`Handling item interaction for ${params.id}`)
				commands.push(...this.handleItemInteraction(params.id, params))
				break
			case 'clickNPC':
				console.log(`Handling NPC interaction for ${params.id}`)
				commands.push(...this.handleNPCInteraction(params.id))
				break
			case 'clickPortal':
				console.log(`Handling portal interaction for ${params.id}`)
				commands.push(...this.handlePortalInteraction(params.id))
				break
			case 'navigateChildLocation':
				console.log(
					`Handling child location navigation to ${params.childLocationId}`
				)
				commands.push(
					...this.handleNavigateChildLocation(params.childLocationId)
				)
				break
			default:
				console.warn(`Unknown interaction type: ${type}`)
		}

		console.log(`Returning commands:`, commands)
		return commands
	}

	private handleItemInteraction(itemId: string, params?: any): Command[] {
		const commands: Command[] = []
		const currentLocation = this.getCurrentLocation()

		console.log(
			`handleItemInteraction: Looking for item ${itemId}, params:`,
			params
		)

		if (!currentLocation) {
			console.log(`handleItemInteraction: No current location found`)
			return commands
		}

		// Check parent location first
		let item = currentLocation.items.find((i) => i.id === itemId)
		console.log(`handleItemInteraction: Found item in parent location:`, item)

		// If not found and we have an active child location, check there
		if (!item && this.game.currentChildLocationId) {
			const childLocation = this.game.locations.find(
				(l) => l.id === this.game.currentChildLocationId
			)
			item = childLocation?.items.find((i) => i.id === itemId)
			console.log(`handleItemInteraction: Found item in child location:`, item)
		}

		if (!item) {
			console.log(`handleItemInteraction: Item ${itemId} not found`)
			return commands
		}

		if (item.state !== EntityState.World) {
			console.log(
				`handleItemInteraction: Item ${itemId} is not in World state, current state: ${item.state}`
			)
			return commands
		}

		console.log(
			`handleItemInteraction: Processing item ${itemId}, interactive: ${item.interactive}`
		)

		// For grabbable items, handle click vs collect differently
		if (item.interactive === InteractiveMode.Grabbable) {
			console.log(
				`handleItemInteraction: Item is grabbable, params.collect: ${params?.collect}, params.playAudioOnly: ${params?.playAudioOnly}`
			)
			if (params?.collect) {
				// E key pressed - collect the item
				console.log(`handleItemInteraction: Collecting grabbable item`)
				// Play interaction audio if specified
				if (item.audioOnInteraction) {
					console.log(
						`handleItemInteraction: Playing interaction audio: ${item.audioOnInteraction}`
					)
					commands.push({
						type: 'playSound',
						params: { url: item.audioOnInteraction },
					})
				}

				// Execute onInteract actions
				item.onInteract.forEach((action) => {
					console.log(
						`handleItemInteraction: Executing onInteract action: ${action.type}`
					)
					commands.push(...this.executeAction(action))
				})

				// Add to inventory and remove from world
				commands.push(...this.addToInventory(itemId))

				// Play grab audio
				if (item.audioOnGrab) {
					console.log(
						`handleItemInteraction: Playing grab audio: ${item.audioOnGrab}`
					)
					commands.push({
						type: 'playSound',
						params: { url: item.audioOnGrab },
					})
				}
			} else if (params?.playAudioOnly) {
				// Mouse click - only play audio, don't collect
				console.log(
					`handleItemInteraction: Playing audio only for grabbable item`
				)
				if (item.audioOnInteraction) {
					console.log(
						`handleItemInteraction: Playing interaction audio: ${item.audioOnInteraction}`
					)
					commands.push({
						type: 'playSound',
						params: { url: item.audioOnInteraction },
					})
				}
			}
		} else {
			// For interactive items, normal behavior - but filter out AddToInventory actions
			console.log(`handleItemInteraction: Item is interactive (not grabbable)`)
			// Play interaction audio if specified
			if (item.audioOnInteraction) {
				console.log(
					`handleItemInteraction: Playing interaction audio: ${item.audioOnInteraction}`
				)
				commands.push({
					type: 'playSound',
					params: { url: item.audioOnInteraction },
				})
			}

			// Execute onInteract actions, but filter out AddToInventory for non-grabbable items
			item.onInteract.forEach((action) => {
				if (action.type === ActionType.AddToInventory) {
					console.log(
						`handleItemInteraction: Skipping AddToInventory action for non-grabbable item`
					)
					return // Skip AddToInventory for interactive items
				}
				console.log(
					`handleItemInteraction: Executing onInteract action: ${action.type}`
				)
				commands.push(...this.executeAction(action))
			})
		}

		// Check quest objectives
		commands.push(...this.checkObjectives(undefined, itemId))

		return commands
	}

	private handleNPCInteraction(npcId: string): Command[] {
		console.log(`handleNPCInteraction called for ${npcId}`)
		const commands: Command[] = []
		const currentLocation = this.getCurrentLocation()

		if (!currentLocation) {
			console.log(`No current location found`)
			return commands
		}

		console.log(
			`Current location: ${currentLocation.id}, child: ${this.game.currentChildLocationId}, npcs:`,
			currentLocation.npcs.map((n) => n.id)
		)

		// Check parent location first
		let npc = currentLocation.npcs.find((n) => n.id === npcId)

		// If not found and we have an active child location, check there
		if (!npc && this.game.currentChildLocationId) {
			const childLocation = this.game.locations.find(
				(l) => l.id === this.game.currentChildLocationId
			)
			npc = childLocation?.npcs.find((n) => n.id === npcId)
			console.log(
				`Child location npcs:`,
				childLocation?.npcs.map((n) => n.id)
			)
		}

		if (!npc) {
			console.log(`NPC ${npcId} not found in current location or active child`)
			return commands
		}
		if (npc.state !== EntityState.World) {
			console.log(`NPC ${npcId} state is ${npc.state}, not World`)
			return commands
		}

		console.log(`NPC found, looking for dialogue...`)
		// Find appropriate dialogue sequence
		const dialogueSequence = this.findDialogueForNPC(npcId)
		console.log(
			`Found dialogue sequence:`,
			dialogueSequence ? dialogueSequence.id : 'none'
		)
		if (dialogueSequence) {
			commands.push({
				type: 'showDialogue',
				params: {
					dialogueSequenceId: dialogueSequence.id,
					npcId: npcId,
				},
			})
		}

		// Execute onInteract actions
		if (npc.onInteract) {
			console.log(`Executing NPC onInteract actions:`, npc.onInteract)
			npc.onInteract.forEach((action) => {
				console.log(`Executing action:`, action)
				commands.push(...this.executeAction(action))
			})
		}

		// Check quest objectives (talkTo type)
		commands.push(...this.checkObjectives(npcId))

		return commands
	}

	private handlePortalInteraction(portalId: string): Command[] {
		console.log(`handlePortalInteraction called for ${portalId}`)
		const commands: Command[] = []
		const currentLocation = this.getCurrentLocation()

		if (!currentLocation) {
			console.log(`No current location found`)
			return commands
		}

		console.log(
			`Current location: ${currentLocation.id}, child: ${this.game.currentChildLocationId}, portals:`,
			currentLocation.portals.map((p) => p.id)
		)

		// Check parent location first
		let portal = currentLocation.portals.find((p) => p.id === portalId)

		// If not found and we have an active child location, check there
		if (!portal && this.game.currentChildLocationId) {
			const childLocation = this.game.locations.find(
				(l) => l.id === this.game.currentChildLocationId
			)
			portal = childLocation?.portals.find((p) => p.id === portalId)
			console.log(
				`Child location portals:`,
				childLocation?.portals.map((p) => p.id)
			)
		}

		if (!portal) {
			console.log(
				`Portal ${portalId} not found in current location or active child`
			)
			return commands
		}
		if (portal.state !== EntityState.World) {
			console.log(`Portal ${portalId} state is ${portal.state}, not World`)
			return commands
		}

		console.log(
			`Portal found, executing onInteract actions:`,
			portal.onInteract
		)
		// Execute onInteract actions (should include ChangeLocation)
		portal.onInteract.forEach((action) => {
			console.log(`Executing action:`, action)
			commands.push(...this.executeAction(action))
		})

		// Check quest objectives after location change
		commands.push(...this.checkObjectives())

		return commands
	}

	private executeAction(action: Action): Command[] {
		const commands: Command[] = []

		switch (action.type) {
			case ActionType.PlaySound:
				commands.push({
					type: 'playSound',
					params: { url: action.params.url },
				})
				break

			case ActionType.AddToInventory:
				commands.push(...this.addToInventory(action.params.entityId))
				break

			case ActionType.RemoveFromInventory:
				commands.push(...this.removeFromInventory(action.params.entityId))
				break

			case ActionType.RemoveFromInventoryByName:
				commands.push(
					...this.removeFromInventoryByName(
						action.params.itemName,
						action.params.count
					)
				)
				break

			case ActionType.GrantToInventory:
				commands.push(...this.grantToInventory(action.params.entityId))
				break

			case ActionType.SetInteractive:
				commands.push(
					...this.setInteractive(
						action.params.entityId,
						action.params.interactiveMode
					)
				)
				break

			case ActionType.SetInteractiveByName:
				commands.push(
					...this.setInteractiveByName(
						action.params.itemName,
						action.params.interactiveMode
					)
				)
				break

			case ActionType.RemoveFromInventoryByType:
				commands.push(
					...this.removeFromInventoryByType(
						action.params.itemType,
						action.params.count
					)
				)
				break

			case ActionType.SetInteractiveByType:
				commands.push(
					...this.setInteractiveByType(
						action.params.itemType,
						action.params.interactiveMode
					)
				)
				break

			case ActionType.SpawnEntity:
				commands.push({
					type: 'spawnEntity',
					params: { id: action.params.entityId },
				})
				this.setEntityState(action.params.entityId, EntityState.World)
				commands.push({
					type: 'updateEntity',
					params: { id: action.params.entityId, state: EntityState.World },
				})
				break

			case ActionType.SpawnEntityByType:
				commands.push(...this.spawnEntityByType(action.params.entityType))
				break

			case ActionType.ClearEntity:
				commands.push({
					type: 'clearEntity',
					params: { id: action.params.entityId },
				})
				this.setEntityState(action.params.entityId, EntityState.Void)
				commands.push({
					type: 'updateEntity',
					params: { id: action.params.entityId, state: EntityState.Void },
				})
				break

			case ActionType.ClearEntityByType:
				commands.push(...this.clearEntityByType(action.params.entityType))
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
				commands.push(...this.startDialogue(action.params.dialogueSequenceId))
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
							console.warn(`Unknown custom action: ${action.params.action}`)
					}
				} else {
					console.warn(`Unknown action type: ${action.type}`)
				}
		}

		return commands
	}

	private handlePlaceSeed(vesselId: string): Command[] {
		const commands: Command[] = []

		// Check if player has a pomegranate seed in inventory
		const seedInInventory = this.game.inventory.find((entityId) => {
			const entity = this.findEntityById(entityId)
			return entity && entity.name === 'Pomegranate Seed'
		})

		if (seedInInventory) {
			// Remove seed from inventory
			commands.push(...this.removeFromInventoryByName('Pomegranate Seed', 1))

			// Send command to frontend to change vessel texture
			commands.push({
				type: 'updateVesselTexture',
				params: {
					vesselId: vesselId,
					activated: true,
				},
			})

			// Make the vessel non-interactive after placement
			commands.push(
				...this.setInteractive(vesselId, InteractiveMode.NotInteractive)
			)

			// Log the action
			commands.push({
				type: 'log',
				params: { message: `Placed pomegranate seed in ${vesselId}` },
			})

			// Increment seeds placed counter
			this.game.seedsPlaced = (this.game.seedsPlaced || 0) + 1

			// Check objectives after placement
			commands.push(...this.checkObjectives())
		} else {
			// No seed in inventory - could show message or play error sound
			commands.push({
				type: 'log',
				params: {
					message: 'You need a pomegranate seed to activate this vessel',
				},
			})
		}

		return commands
	}

	private addToInventory(entityId: string): Command[] {
		if (!this.game.inventory.includes(entityId)) {
			this.game.inventory.push(entityId)
			this.setEntityState(entityId, EntityState.Inventory)
		}
		return [
			{
				type: 'updateInventory',
				params: { inventory: [...this.game.inventory] },
			},
			{
				type: 'updateEntity',
				params: { id: entityId, state: EntityState.Inventory },
			},
		]
	}

	private removeFromInventory(entityId: string): Command[] {
		const index = this.game.inventory.indexOf(entityId)
		if (index > -1) {
			this.game.inventory.splice(index, 1)
			// Entity state will be set by the calling context (e.g., to World or Void)
		}
		return [
			{
				type: 'updateInventory',
				params: { inventory: [...this.game.inventory] },
			},
		]
	}

	private removeFromInventoryByName(
		itemName: string,
		count: number
	): Command[] {
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
				type: 'updateInventory',
				params: { inventory: [...this.game.inventory] },
			},
		]
	}

	private grantToInventory(entityId: string): Command[] {
		if (!this.game.inventory.includes(entityId)) {
			this.game.inventory.push(entityId)
			this.setEntityState(entityId, EntityState.Inventory)
		}
		return [
			{
				type: 'updateInventory',
				params: { inventory: [...this.game.inventory] },
			},
			{
				type: 'updateEntity',
				params: { id: entityId, state: EntityState.Inventory },
			},
		]
	}

	private setInteractive(
		entityId: string,
		interactiveMode: InteractiveMode
	): Command[] {
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

		return [
			{
				type: 'updateEntity',
				params: { id: entityId, interactive: interactiveMode },
			},
		]
	}

	private setInteractiveByName(
		itemName: string,
		interactiveMode: InteractiveMode
	): Command[] {
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
			type: 'updateEntity',
			params: { id: entityId, interactive: interactiveMode },
		}))
	}

	private removeFromInventoryByType(
		itemType: string,
		count: number
	): Command[] {
		// Find entities in inventory that match the type
		const entitiesToRemove: string[] = []
		let removedCount = 0

		for (const entityId of this.game.inventory) {
			if (removedCount >= count) break

			const entity = this.findEntityById(entityId)
			if (entity && 'type' in entity && entity.type === itemType) {
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
				type: 'updateInventory',
				params: { inventory: [...this.game.inventory] },
			},
		]
	}

	private setInteractiveByType(
		itemType: string,
		interactiveMode: InteractiveMode
	): Command[] {
		const updatedEntityIds: string[] = []

		// Update all items with matching type across all locations
		for (const location of this.game.locations) {
			location.items.forEach((item) => {
				if (item.type === itemType) {
					item.interactive = interactiveMode
					updatedEntityIds.push(item.id)
				}
			})

			// Portals can also be updated by type
			location.portals.forEach((portal) => {
				if (portal.type === itemType) {
					portal.interactive = interactiveMode
					updatedEntityIds.push(portal.id)
				}
			})
		}

		// Also check global entities
		this.game.items.forEach((item) => {
			if (item.type === itemType) {
				item.interactive = interactiveMode
				if (!updatedEntityIds.includes(item.id)) {
					updatedEntityIds.push(item.id)
				}
			}
		})

		this.game.portals.forEach((portal) => {
			if (portal.type === itemType) {
				portal.interactive = interactiveMode
				if (!updatedEntityIds.includes(portal.id)) {
					updatedEntityIds.push(portal.id)
				}
			}
		})

		// Return commands for each updated entity
		return updatedEntityIds.map((entityId) => ({
			type: 'updateEntity',
			params: { id: entityId, interactive: interactiveMode },
		}))
	}

	private spawnEntityByType(entityType: string): Command[] {
		const commands: Command[] = []
		const spawnedEntityIds: string[] = []

		// Spawn all entities of the given type across all locations
		for (const location of this.game.locations) {
			// Check items
			location.items.forEach((item) => {
				if (item.type === entityType && item.state === EntityState.Void) {
					item.state = EntityState.World
					spawnedEntityIds.push(item.id)
				}
			})

			// Check portals
			location.portals.forEach((portal) => {
				if (portal.type === entityType && portal.state === EntityState.Void) {
					portal.state = EntityState.World
					spawnedEntityIds.push(portal.id)
				}
			})
		}

		// Also check global entities
		this.game.items.forEach((item) => {
			if (item.type === entityType && item.state === EntityState.Void) {
				item.state = EntityState.World
				if (!spawnedEntityIds.includes(item.id)) {
					spawnedEntityIds.push(item.id)
				}
			}
		})

		this.game.portals.forEach((portal) => {
			if (portal.type === entityType && portal.state === EntityState.Void) {
				portal.state = EntityState.World
				if (!spawnedEntityIds.includes(portal.id)) {
					spawnedEntityIds.push(portal.id)
				}
			}
		})

		// Return spawn commands for each entity
		spawnedEntityIds.forEach((entityId) => {
			commands.push(
				{ type: 'spawnEntity', params: { id: entityId } },
				{
					type: 'updateEntity',
					params: { id: entityId, state: EntityState.World },
				}
			)
		})

		return commands
	}

	private clearEntityByType(entityType: string): Command[] {
		const commands: Command[] = []
		const clearedEntityIds: string[] = []

		// Clear all entities of the given type across all locations
		for (const location of this.game.locations) {
			// Check items
			location.items.forEach((item) => {
				if (item.type === entityType && item.state === EntityState.World) {
					item.state = EntityState.Void
					clearedEntityIds.push(item.id)
				}
			})

			// Check portals
			location.portals.forEach((portal) => {
				if (portal.type === entityType && portal.state === EntityState.World) {
					portal.state = EntityState.Void
					clearedEntityIds.push(portal.id)
				}
			})
		}

		// Also check global entities
		this.game.items.forEach((item) => {
			if (item.type === entityType && item.state === EntityState.World) {
				item.state = EntityState.Void
				if (!clearedEntityIds.includes(item.id)) {
					clearedEntityIds.push(item.id)
				}
			}
		})

		this.game.portals.forEach((portal) => {
			if (portal.type === entityType && portal.state === EntityState.World) {
				portal.state = EntityState.Void
				if (!clearedEntityIds.includes(portal.id)) {
					clearedEntityIds.push(portal.id)
				}
			}
		})

		// Return clear commands for each entity
		clearedEntityIds.forEach((entityId) => {
			commands.push(
				{ type: 'clearEntity', params: { id: entityId } },
				{
					type: 'updateEntity',
					params: { id: entityId, state: EntityState.Void },
				}
			)
		})

		return commands
	}

	private activateQuest(questId: string): Command[] {
		const commands: Command[] = []
		const quest = this.game.quests.find((q) => q.id === questId)

		if (!quest || this.game.activeQuests.includes(questId) || quest.completed) {
			return commands
		}

		this.game.activeQuests.push(questId)

		// Find the first step that is not completed
		const firstIncompleteStep = quest.steps.find((step) => !step.isCompleted)

		if (firstIncompleteStep) {
			quest.activeStepId = firstIncompleteStep.id

			// Execute onStart actions for the current step
			firstIncompleteStep.onStart.forEach((action) => {
				commands.push(...this.executeAction(action))
			})

			commands.push({
				type: 'log',
				params: {
					message: `Quest started: ${quest.title}. Now starting: ${firstIncompleteStep.name}`,
				},
			})
		} else {
			// All steps are completed, mark quest as completed
			quest.completed = true
			this.game.activeQuests = this.game.activeQuests.filter(
				(id) => id !== questId
			)

			commands.push({
				type: 'questCompleted',
				params: { questId, questTitle: quest.title, quest },
			})

			commands.push({
				type: 'log',
				params: {
					message: `Quest completed: ${quest.title}`,
				},
			})

			// Send quest progress update
			commands.push(...this.sendQuestProgressUpdate())
			return commands
		}

		commands.push({
			type: 'questActivated',
			params: { questId, questTitle: quest.title, quest },
		})

		// Send quest progress update
		commands.push(...this.sendQuestProgressUpdate())

		return commands
	}

	private advanceStep(): Command[] {
		const commands: Command[] = []

		// Find current active quest and step
		for (const questId of this.game.activeQuests) {
			const quest = this.game.quests.find((q) => q.id === questId)
			if (!quest || quest.completed) continue

			const currentStepIndex = quest.steps.findIndex(
				(s) => s.id === quest.activeStepId
			)
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
					type: 'log',
					params: {
						message: `Quest step completed: ${currentStep.name}. Now starting: ${nextStep.name}`,
					},
				})
			} else {
				// Quest completed
				quest.completed = true
				this.game.activeQuests = this.game.activeQuests.filter(
					(id) => id !== questId
				)
				commands.push({
					type: 'questCompleted',
					params: { questId, questTitle: quest.title, quest },
				})
			}

			// Send quest progress update after any step advancement
			commands.push(...this.sendQuestProgressUpdate())

			break // Only advance one step at a time
		}

		return commands
	}

	private startDialogue(dialogueSequenceId: string): Command[] {
		const commands: Command[] = []

		// Find the dialogue sequence
		const dialogueSequence = this.game.dialogues.find(
			(d) => d.id === dialogueSequenceId
		)
		if (!dialogueSequence) {
			console.warn(`Dialogue sequence ${dialogueSequenceId} not found`)
			return commands
		}

		// Start the dialogue automatically
		const params: any = {
			dialogueSequenceId: dialogueSequenceId,
		}

		// Only include npcId if it exists
		if (dialogueSequence.npcId) {
			params.npcId = dialogueSequence.npcId
		}

		commands.push({
			type: 'showDialogue',
			params: params,
		})

		return commands
	}

	// Helper method to create grid entities for a single location
	private createGridEntities(location: Location): GridEntity[] {
		const gridEntities: GridEntity[] = []

		location.items.forEach((item) => {
			console.log(
				'🎵 GameEngine: Creating grid entity for item:',
				item.id,
				'audio:',
				item.audio
			)
			gridEntities.push({
				id: item.id,
				name: item.name,
				type: 'item',
				image: item.image,
				state: item.state,
				interactive: item.interactive,
				audio: item.audio,
			})
		})

		location.npcs.forEach((npc) => {
			gridEntities.push({
				id: npc.id,
				name: npc.name,
				type: 'npc',
				image: npc.image,
				state: npc.state,
			})
		})

		location.portals.forEach((portal) => {
			gridEntities.push({
				id: portal.id,
				name: portal.name,
				type: 'portal',
				image: portal.image,
				state: portal.state,
				interactive: portal.interactive,
			})
		})

		return gridEntities
	}

	// Helper method to combine parent and child entities (parent first, then child, no duplicates)
	private createCombinedEntities(
		parentLocation: Location,
		childLocation: Location
	): GridEntity[] {
		const entities: GridEntity[] = []

		// Add parent entities first
		entities.push(...this.createGridEntities(parentLocation))

		// Add child entities (skip duplicates by ID)
		const parentEntityIds = new Set([
			...parentLocation.items.map((i) => i.id),
			...parentLocation.npcs.map((n) => n.id),
			...parentLocation.portals.map((p) => p.id),
		])

		childLocation.items.forEach((item) => {
			if (!parentEntityIds.has(item.id)) {
				entities.push({
					id: item.id,
					name: item.name,
					type: 'item',
					image: item.image,
					state: item.state,
					interactive: item.interactive,
					audio: item.audio,
				})
			}
		})

		childLocation.npcs.forEach((npc) => {
			if (!parentEntityIds.has(npc.id)) {
				entities.push({
					id: npc.id,
					name: npc.name,
					type: 'npc',
					image: npc.image,
					state: npc.state,
				})
			}
		})

		childLocation.portals.forEach((portal) => {
			if (!parentEntityIds.has(portal.id)) {
				entities.push({
					id: portal.id,
					name: portal.name,
					type: 'portal',
					image: portal.image,
					state: portal.state,
					interactive: portal.interactive,
				})
			}
		})

		return entities
	}

	private changeLocation(locationId: string): Command[] {
		const commands: Command[] = []
		const newLocation = this.game.locations.find((l) => l.id === locationId)

		if (!newLocation) return commands

		this.game.currentLocationId = locationId

		let entities: GridEntity[] = []
		let childLocations: any[] = []
		let displayLocationName = newLocation.name
		let displayBackgroundImage = newLocation.image
		let displayBackgroundMusic = newLocation.backgroundMusic

		if (newLocation.locations && newLocation.locations.length > 0) {
			// Parent location with children - set first child as active
			const firstChild = newLocation.locations[0]
			this.game.currentChildLocationId = firstChild.id

			// Combine parent and child entities
			entities = this.createCombinedEntities(newLocation, firstChild)

			// Use child location's display properties
			displayLocationName = firstChild.name
			displayBackgroundImage = firstChild.image || newLocation.image
			displayBackgroundMusic =
				firstChild.backgroundMusic || newLocation.backgroundMusic

			// Set up child locations for navigation
			childLocations = newLocation.locations.map((childLocation) => ({
				id: childLocation.id,
				name: childLocation.name,
				backgroundImage: childLocation.image,
				backgroundMusic: childLocation.backgroundMusic,
				entities: this.createGridEntities(childLocation),
			}))
		} else {
			// Regular location without children
			this.game.currentChildLocationId = undefined
			entities = this.createGridEntities(newLocation)
		}

		console.log(
			'🎵 GameEngine: Sending updateLocation with entities:',
			entities.map((e) => ({ id: e.id, audio: e.audio }))
		)
		commands.push({
			type: 'updateLocation',
			params: {
				locationId,
				locationName: displayLocationName,
				backgroundImage: displayBackgroundImage,
				backgroundMusic: displayBackgroundMusic,
				entities,
				childLocations: childLocations.length > 0 ? childLocations : undefined,
			},
		})

		return commands
	}

	private checkObjectives(
		interactedNpcId?: string,
		interactedItemId?: string
	): Command[] {
		const commands: Command[] = []

		console.log(
			`[QuestEngine] Checking objectives for ${this.game.activeQuests.length} active quests:`,
			this.game.activeQuests
		)

		for (const questId of this.game.activeQuests) {
			const quest = this.game.quests.find((q) => q.id === questId)
			if (!quest || quest.completed) continue

			const currentStep = quest.steps.find((s) => s.id === quest.activeStepId)
			if (!currentStep) continue

			let objectiveCompleted = false

			switch (currentStep.objectiveType) {
				case 'collectEntities':
					const { entityIds } = currentStep.objectiveParams
					if (
						entityIds &&
						entityIds.every((id: string) => this.game.inventory.includes(id))
					) {
						objectiveCompleted = true
					}
					break

				case 'collectByName':
					const { itemName, count = 1 } = currentStep.objectiveParams
					console.log(
						`[QuestEngine] Checking collectByName objective: looking for "${itemName}" (count: ${count})`
					)
					console.log(`[QuestEngine] Current inventory:`, this.game.inventory)
					if (itemName) {
						// Count how many items with this name are in inventory
						const matchingItems = this.game.inventory.filter((entityId) => {
							// Find the entity and check if its name matches
							const entity = this.findEntityById(entityId)
							console.log(
								`[QuestEngine] Checking item ${entityId}: name="${
									entity?.name
								}", matches="${entity?.name === itemName}"`
							)
							return entity && entity.name === itemName
						})
						console.log(
							`[QuestEngine] Found ${matchingItems.length} matching items:`,
							matchingItems
						)
						if (matchingItems.length >= count) {
							console.log(
								`[QuestEngine] Objective completed! ${matchingItems.length} >= ${count}`
							)
							objectiveCompleted = true
						} else {
							console.log(
								`[QuestEngine] Objective not completed. ${matchingItems.length} < ${count}`
							)
						}
					}
					break

				case 'collectByType':
					const { itemType, count: typeCount = 1 } = currentStep.objectiveParams
					// Ensure count is at least 1 if not specified or empty
					const targetCount = typeCount && typeCount > 0 ? typeCount : 1
					console.log(
						`[QuestEngine] Checking collectByType objective: looking for "${itemType}" (count: ${targetCount})`
					)
					console.log(`[QuestEngine] Current inventory:`, this.game.inventory)
					if (itemType) {
						// Count how many items with this type are in inventory
						let itemsOfTypeCount = 0
						for (const entityId of this.game.inventory) {
							// Find the entity and check if it's an Item with matching type
							const entity = this.findEntityById(entityId)
							const isItemWithType =
								entity && 'type' in entity && entity.type === itemType
							console.log(
								`[QuestEngine] Checking item ${entityId}: type="${
									entity && 'type' in entity ? entity.type : 'N/A'
								}", matches="${isItemWithType}"`
							)
							if (isItemWithType) {
								itemsOfTypeCount++
							}
						}
						console.log(
							`[QuestEngine] Found ${itemsOfTypeCount} items of type "${itemType}" (required: ${targetCount})`
						)
						if (itemsOfTypeCount >= targetCount) {
							console.log(
								`[QuestEngine] Objective completed! ${itemsOfTypeCount} >= ${targetCount}`
							)
							objectiveCompleted = true
						} else {
							console.log(
								`[QuestEngine] Objective not completed. ${itemsOfTypeCount} < ${targetCount}`
							)
						}
					}
					break

				case 'talkTo':
					// Check if this is the NPC that was just interacted with
					if (
						interactedNpcId &&
						currentStep.objectiveParams.npcId === interactedNpcId
					) {
						objectiveCompleted = true
					}
					break

				case 'interact':
					// Check if this is the item that was just interacted with
					if (
						interactedItemId &&
						currentStep.objectiveParams.itemId === interactedItemId
					) {
						objectiveCompleted = true
					}
					break

				case 'custom':
					const { targetId, requiredCount } = currentStep.objectiveParams
					if (targetId === 'seeds_placed') {
						objectiveCompleted =
							(this.game.seedsPlaced || 0) >= (requiredCount || 5)
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
			if (
				currentStep.objectiveType === 'talkTo' &&
				currentStep.objectiveParams.npcId === npcId
			) {
				relevantQuestSteps.push(currentStep.id)
			} else {
				// Check if there's a dialogue for this quest step and NPC
				const dialogueExists = this.game.dialogues.some(
					(d) => d.npcId === npcId && d.questStepId === currentStep.id
				)
				if (dialogueExists) {
					relevantQuestSteps.push(currentStep.id)
				}
			}
		}

		// Look for dialogue sequences that match NPC and quest step
		for (const questStepId of relevantQuestSteps) {
			const dialogue = this.game.dialogues.find(
				(d) => d.npcId === npcId && d.questStepId === questStepId
			)
			if (dialogue) {
				return dialogue
			}
		}

		// If no specific dialogue found, look for default dialogue in "npcId_default" format
		const defaultDialogueId = `${npcId}_default`
		const defaultDialogue = this.game.dialogues.find(
			(d) => d.id === defaultDialogueId
		)
		if (defaultDialogue) {
			return defaultDialogue
		}

		// Fallback: look for any dialogue with questStepId: null for this NPC
		const fallbackDialogue = this.game.dialogues.find(
			(d) => d.npcId === npcId && d.questStepId === null
		)
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

	private handleNavigateChildLocation(childLocationId: string): Command[] {
		const commands: Command[] = []

		// Get the parent location (should be currentLocationId)
		const parentLocation = this.game.locations.find(
			(l) => l.id === this.game.currentLocationId
		)
		if (!parentLocation) {
			console.warn(`Parent location ${this.game.currentLocationId} not found`)
			return commands
		}

		// Verify the child location exists and is a child of the parent
		const childLocation = parentLocation.locations?.find(
			(l) => l.id === childLocationId
		)
		if (!childLocation) {
			console.warn(
				`Child location ${childLocationId} not found in parent ${parentLocation.id}`
			)
			return commands
		}

		// Update the active child location
		this.game.currentChildLocationId = childLocationId

		// Combine parent and new child entities
		const entities = this.createCombinedEntities(parentLocation, childLocation)

		// Return commands to update the frontend
		commands.push({
			type: 'updateLocation',
			params: {
				locationId: this.game.currentLocationId, // Parent location ID
				locationName: childLocation.name, // Show child name in UI
				backgroundImage: childLocation.image || parentLocation.image,
				backgroundMusic:
					childLocation.backgroundMusic || parentLocation.backgroundMusic,
				entities,
				childLocations: parentLocation.locations?.map((child) => ({
					id: child.id,
					name: child.name,
					backgroundImage: child.image,
					backgroundMusic: child.backgroundMusic,
					entities: this.createGridEntities(child),
				})),
			},
		})

		return commands
	}

	private getCurrentLocation(): Location | undefined {
		return this.game.locations.find((l) => l.id === this.game.currentLocationId)
	}

	// Get current game state (sync version for backward compatibility - requires initializeGame to be called first)
	getGameState(): Game {
		return this.game
	}

	// Load game state (async version)
	async loadGame(): Promise<Game> {
		return await this.persistence.loadGame()
	}

	// Save game state
	async saveGame(): Promise<void> {
		await this.persistence.saveGame(this.game)
	}

	// Send quest progress update to frontend
	private sendQuestProgressUpdate(): Command[] {
		// Get all quests that are either active or completed
		const relevantQuests = this.game.quests.filter(
			(quest) => this.game.activeQuests.includes(quest.id) || quest.completed
		)

		return [
			{
				type: 'questProgressUpdate',
				params: {
					quests: relevantQuests,
				},
			},
		]
	}
}
