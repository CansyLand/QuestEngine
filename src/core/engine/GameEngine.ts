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
		this.resetClearedStates()
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

		// Activate starting quests (those with order 0 or prerequisites met)
		const startingQuests = this.game.quests.filter((quest) => quest.order === 0)
		startingQuests.forEach((quest) => {
			commands.push(...this.activateQuest(quest.id))
		})

		return commands
	}

	// Process player interactions
	processInteraction(type: string, params: any): Command[] {
		console.log(`Processing interaction: ${type} with params:`, params)
		const commands: Command[] = []

		switch (type) {
			case 'clickItem':
				console.log(`Handling item interaction for ${params.id}`)
				commands.push(...this.handleItemInteraction(params.id))
				break
			case 'clickNPC':
				console.log(`Handling NPC interaction for ${params.id}`)
				commands.push(...this.handleNPCInteraction(params.id))
				break
			case 'clickPortal':
				console.log(`Handling portal interaction for ${params.id}`)
				commands.push(...this.handlePortalInteraction(params.id))
				break
			default:
				console.warn(`Unknown interaction type: ${type}`)
		}

		console.log(`Returning commands:`, commands)
		return commands
	}

	private handleItemInteraction(itemId: string): Command[] {
		const commands: Command[] = []
		const currentLocation = this.getCurrentLocation()

		if (!currentLocation) return commands

		const item = currentLocation.items.find((i) => i.id === itemId)
		if (!item || item.state !== EntityState.World) return commands

		// Play interaction audio if specified
		if (item.audioOnInteraction) {
			commands.push({
				type: 'playSound',
				params: { url: item.audioOnInteraction },
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
					type: 'playSound',
					params: { url: item.audioOnGrab },
				})
			}
		}

		// Check quest objectives
		commands.push(...this.checkObjectives())

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
			`Current location: ${currentLocation.id}, npcs:`,
			currentLocation.npcs.map((n) => n.id)
		)
		const npc = currentLocation.npcs.find((n) => n.id === npcId)
		if (!npc) {
			console.log(`NPC ${npcId} not found in current location`)
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
			`Current location: ${currentLocation.id}, portals:`,
			currentLocation.portals.map((p) => p.id)
		)
		const portal = currentLocation.portals.find((p) => p.id === portalId)
		if (!portal) {
			console.log(`Portal ${portalId} not found in current location`)
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

	private activateQuest(questId: string): Command[] {
		const commands: Command[] = []
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
			type: 'questActivated',
			params: { questId, questTitle: quest.title },
		})

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
						message: `Quest step completed: ${currentStep.name}. Next: ${nextStep.name}`,
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
					params: { questId, questTitle: quest.title },
				})
			}

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

	private changeLocation(locationId: string): Command[] {
		const commands: Command[] = []
		const newLocation = this.game.locations.find((l) => l.id === locationId)

		if (!newLocation) return commands

		// Update current location
		this.game.currentLocationId = locationId

		// Create grid entities for the new location
		const gridEntities: GridEntity[] = []

		newLocation.items.forEach((item) => {
			gridEntities.push({
				id: item.id,
				name: item.name,
				type: 'item',
				image: item.image,
				state: item.state,
				interactive: item.interactive,
			})
		})

		newLocation.npcs.forEach((npc) => {
			gridEntities.push({
				id: npc.id,
				name: npc.name,
				type: 'npc',
				image: npc.image,
				state: npc.state,
			})
		})

		newLocation.portals.forEach((portal) => {
			gridEntities.push({
				id: portal.id,
				name: portal.name,
				type: 'portal',
				image: portal.image,
				state: portal.state,
				interactive: portal.interactive,
			})
		})

		// Send updateLocation command with all entities
		commands.push({
			type: 'updateLocation',
			params: {
				locationId,
				locationName: newLocation.name,
				backgroundImage: newLocation.image,
				backgroundMusic: newLocation.backgroundMusic,
				entities: gridEntities,
			},
		})

		return commands
	}

	private checkObjectives(interactedNpcId?: string): Command[] {
		const commands: Command[] = []

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
					const { itemName, count } = currentStep.objectiveParams
					if (itemName && count) {
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
					if (
						interactedNpcId &&
						currentStep.objectiveParams.npcId === interactedNpcId
					) {
						objectiveCompleted = true
					}
					break

				case 'interact':
					// Custom interaction logic
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
}
