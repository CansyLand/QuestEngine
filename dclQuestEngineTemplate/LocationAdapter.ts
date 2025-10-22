// src/questEngine/LocationAdapter.ts - Adapts location management for individual entity control

import { Location, EntityState } from './models'
import { EntityManager } from './EntityManager'
import { QuestCommand, QuestCommandType } from './types'
import { EMBEDDED_LOCATIONS, EMBEDDED_NPCS } from './data'
import { getDecentralandName } from './entityMappings'
import { npcPortraitOverrides } from '../index'
import { initializeExistingEntity, NPCType } from './npcToolkit'
import { npcDataComponent, activeNPC, clearNPC } from './npcToolkit/npc'
import { npcDialogComponent } from './npcToolkit/dialog'
import { engine, Entity } from '@dcl/sdk/ecs'

export class LocationAdapter {
	private entityManager: EntityManager
	private questEngine: any // Reference to QuestEngine for triggering interactions
	private currentLocationId?: string
	private debugMode: boolean = false

	constructor(
		entityManager: EntityManager,
		questEngine: any,
		debugMode: boolean = false
	) {
		this.entityManager = entityManager
		this.questEngine = questEngine
		this.debugMode = debugMode
	}

	/**
	 * Handle location change by managing entity visibility
	 * Instead of using locationManager.ts bulk operations, we manage individual entities
	 */
	changeLocation(location: Location): QuestCommand[] {
		const commands: QuestCommand[] = []

		if (this.debugMode) {
			console.log(`LocationAdapter: Changing to location ${location.id}`)
			console.log(
				`Location NPCs:`,
				location.npcs.map((n) => n.id)
			)
			console.log(
				`Location items:`,
				location.items.map((i) => i.id)
			)
		}

		// Hide entities from previous location (if any), or hide all entities if starting fresh
		if (this.currentLocationId) {
			commands.push(...this.hideLocationEntities(this.currentLocationId))
		} else {
			// No previous location - hide all entities before showing new location entities
			commands.push(...this.hideAllEntities())
		}

		// Show entities for new location
		commands.push(...this.showLocationEntities(location))

		// Update current location
		this.currentLocationId = location.id

		// Add location change command for scene controller
		commands.push({
			type: QuestCommandType.ChangeLocation,
			params: { locationId: location.id },
		})

		return commands
	}

	/**
	 * Generate commands to hide all entities (used when starting fresh with no previous location)
	 */
	private hideAllEntities(): QuestCommand[] {
		const commands: QuestCommand[] = []
		const allEntityIds = this.entityManager.getAllEntityIds()

		for (const entityId of allEntityIds) {
			commands.push({
				type: QuestCommandType.SetEntityVisibility,
				params: { entityId, visible: false },
			})
			commands.push({
				type: QuestCommandType.SetEntityCollider,
				params: { entityId, colliderLayer: 0 }, // CL_NONE
			})
			commands.push({
				type: QuestCommandType.RemoveGltfComponent,
				params: { entityId },
			})
		}

		if (this.debugMode) {
			console.log(`Hiding all ${allEntityIds.length} entities (initial state)`)
		}

		return commands
	}

	/**
	 * Generate commands to hide all entities in a location
	 */
	private hideLocationEntities(locationId: string): QuestCommand[] {
		const commands: QuestCommand[] = []

		// Get all entity IDs that should be hidden when leaving this location
		// This is a simplified approach - in practice, you'd track which entities belong to which location
		const locationEntityIds = this.getEntitiesForLocation(locationId)

		for (const entityId of locationEntityIds) {
			// Check if this entity is an NPC and clean it up properly
			const isNPC = EMBEDDED_NPCS.some((npc) => npc.id === entityId)
			if (isNPC) {
				const npcEntity = this.entityManager.getEntityMap().get(entityId)
				if (npcEntity) {
					// Clean up exported npcToolkit components
					// The npcToolkit handles cleanup of its internal Maps
					npcDataComponent.delete(npcEntity)
					if (npcDialogComponent.has(npcEntity)) {
						npcDialogComponent.delete(npcEntity)
					}
					if (activeNPC === npcEntity) {
						clearNPC()
					}
				}
			}

			commands.push({
				type: QuestCommandType.SetEntityVisibility,
				params: { entityId, visible: false },
			})
			commands.push({
				type: QuestCommandType.SetEntityCollider,
				params: { entityId, colliderLayer: 0 }, // CL_NONE
			})
			commands.push({
				type: QuestCommandType.RemoveGltfComponent,
				params: { entityId },
			})

			// Note: Entities that have been spawned during quests (state changed to 'world')
			// will retain their state when changing locations, as expected by quest logic
		}

		if (this.debugMode) {
			console.log(
				`Hiding ${locationEntityIds.length} entities for location ${locationId}`
			)
		}

		return commands
	}

	/**
	 * Generate commands to show entities for a location based on their states
	 */
	private showLocationEntities(location: Location): QuestCommand[] {
		const commands: QuestCommand[] = []

		// Process items
		for (const item of location.items) {
			if (item.state === 'world') {
				commands.push(
					{
						type: QuestCommandType.SetEntityVisibility,
						params: { entityId: item.id, visible: true },
					},
					{
						type: QuestCommandType.AddGltfComponent,
						params: { entityId: item.id },
					},
					{
						type: QuestCommandType.SetEntityCollider,
						params: {
							entityId: item.id,
							colliderLayer: item.interactive === 'grabbable' ? 3 : 1, // CL_POINTER | CL_PHYSICS : CL_POINTER
						},
					}
				)
			} else if (item.state === 'void') {
				// Explicitly hide void entities
				commands.push(
					{
						type: QuestCommandType.SetEntityVisibility,
						params: { entityId: item.id, visible: false },
					},
					{
						type: QuestCommandType.RemoveGltfComponent,
						params: { entityId: item.id },
					},
					{
						type: QuestCommandType.SetEntityCollider,
						params: { entityId: item.id, colliderLayer: 0 }, // CL_NONE
					}
				)
			}
		}

		// Process NPCs - Initialize as proper npcToolkit NPCs
		for (const npc of location.npcs) {
			if (this.debugMode) {
				console.log(`Processing NPC: ${npc.id}, state: ${npc.state}`)
			}
			if (npc.state === 'world') {
				// Get the full NPC definition from EMBEDDED_NPCS
				const npcDefinition = EMBEDDED_NPCS.find((n) => n.id === npc.id)
				if (npcDefinition) {
					if (this.debugMode) {
						console.log(
							`Found NPC definition for ${npc.id}: ${npcDefinition.name}`
						)
					}
				} else {
					if (this.debugMode) {
						console.log(`No NPC definition found for ${npc.id}`)
					}
					continue // Skip to next NPC if no definition found
				}

				// Create NPC data for npcToolkit - simple initialization
				// npcToolkit will handle all NPC behavior, quest engine just manages visibility/state
				const npcData = {
					type: NPCType.CUSTOM,
					onActivate: (other: Entity) => {
						// Simple callback that triggers quest engine interaction
						// Quest engine will determine appropriate dialogue based on current quest state
						const commands = this.questEngine.processInteraction('clickNPC', {
							id: npc.id,
						})
						this.questEngine.executeCommands(commands)
					},
					faceUser: true,
					reactDistance: 4,
					portrait: npcPortraitOverrides.get(npc.id) || npcDefinition.image, // Use override if available
					hoverText: npcDefinition.name || 'Talk',
				}

				// Initialize existing entity as proper npcToolkit NPC
				// Get the entity by correct Decentraland name from mappings (e.g., halloween-punmpkin-with-hat.glb)
				const npcEntityName = getDecentralandName(npc.id)
				if (!npcEntityName) {
					console.log(`No entity mapping found for NPC: ${npc.id}`)
					continue
				}

				console.log(
					`Looking for NPC entity: ${npcEntityName} for NPC: ${npc.id}`
				)
				const npcEntity =
					this.entityManager.getEntityByDecentralandName(npcEntityName)
				if (npcEntity) {
					console.log(`Found NPC entity, initializing as npcToolkit NPC`)

					// Only initialize NPC if not already initialized
					if (!npcDataComponent.has(npcEntity)) {
						initializeExistingEntity(npcEntity, npcData)
					}

					commands.push({
						type: QuestCommandType.SetEntityVisibility,
						params: { entityId: npc.id, visible: true },
					})
					commands.push({
						type: QuestCommandType.AddGltfComponent,
						params: { entityId: npc.id },
					})
				} else {
					console.log(`NPC entity not found: ${npcEntityName}`)
				}
			} else if (npc.state === 'void') {
				// Explicitly hide void NPCs
				commands.push(
					{
						type: QuestCommandType.SetEntityVisibility,
						params: { entityId: npc.id, visible: false },
					},
					{
						type: QuestCommandType.RemoveGltfComponent,
						params: { entityId: npc.id },
					},
					{
						type: QuestCommandType.SetEntityCollider,
						params: { entityId: npc.id, colliderLayer: 0 }, // CL_NONE
					}
				)
			}
		}

		// Process portals
		for (const portal of location.portals) {
			if (portal.state === 'world') {
				commands.push(
					{
						type: QuestCommandType.SetEntityVisibility,
						params: { entityId: portal.id, visible: true },
					},
					{
						type: QuestCommandType.AddGltfComponent,
						params: { entityId: portal.id },
					},
					{
						type: QuestCommandType.SetEntityCollider,
						params: {
							entityId: portal.id,
							colliderLayer: portal.interactive === 'notInteractive' ? 0 : 1, // CL_NONE : CL_POINTER
						},
					}
				)
			} else if (portal.state === 'void') {
				// Explicitly hide void portals
				commands.push(
					{
						type: QuestCommandType.SetEntityVisibility,
						params: { entityId: portal.id, visible: false },
					},
					{
						type: QuestCommandType.RemoveGltfComponent,
						params: { entityId: portal.id },
					},
					{
						type: QuestCommandType.SetEntityCollider,
						params: { entityId: portal.id, colliderLayer: 0 }, // CL_NONE
					}
				)
			}
		}

		if (this.debugMode) {
			const entityCount =
				location.items.length + location.npcs.length + location.portals.length
			console.log(
				`Showing entities for location ${location.id}: ${entityCount} total entities`
			)
		}

		return commands
	}

	/**
	 * Get all entity IDs that belong to a specific location
	 * This uses the EMBEDDED_LOCATIONS data to determine which entities belong to each location
	 */
	private getEntitiesForLocation(locationId: string): string[] {
		const location = EMBEDDED_LOCATIONS.find(
			(loc: any) => loc.id === locationId
		)
		if (!location) {
			if (this.debugMode) {
				console.log(`LocationAdapter: No location found with ID ${locationId}`)
			}
			return []
		}

		// Collect all entity IDs from this location's items, npcs, and portals
		const entityIds: string[] = []

		// Add items
		if (location.items) {
			entityIds.push(...location.items.map((item: any) => item.id))
		}

		// Add NPCs
		if (location.npcs) {
			entityIds.push(...location.npcs.map((npc: any) => npc.id))
		}

		// Add portals
		if (location.portals) {
			entityIds.push(...location.portals.map((portal: any) => portal.id))
		}

		if (this.debugMode) {
			console.log(
				`LocationAdapter: Found ${entityIds.length} entities for location ${locationId}:`,
				entityIds
			)
		}

		return entityIds
	}

	/**
	 * Update entity state when it changes (e.g., picked up, spawned, etc.)
	 */
	updateEntityState(
		entityId: string,
		state: 'world' | 'inventory' | 'void'
	): QuestCommand[] {
		const commands: QuestCommand[] = []

		switch (state) {
			case 'world':
				commands.push(
					{
						type: QuestCommandType.SetEntityVisibility,
						params: { entityId, visible: true },
					},
					{
						type: QuestCommandType.AddGltfComponent,
						params: { entityId },
					},
					{
						type: QuestCommandType.SetEntityCollider,
						params: { entityId, colliderLayer: 1 }, // CL_POINTER
					}
				)
				break

			case 'inventory':
				commands.push(
					{
						type: QuestCommandType.SetEntityVisibility,
						params: { entityId, visible: false },
					},
					{
						type: QuestCommandType.SetEntityCollider,
						params: { entityId, colliderLayer: 0 }, // CL_NONE
					}
					// Note: Keep GLTF component for inventory items (may be shown in UI)
				)
				break

			case 'void':
				commands.push(
					{
						type: QuestCommandType.SetEntityVisibility,
						params: { entityId, visible: false },
					},
					{
						type: QuestCommandType.SetEntityCollider,
						params: { entityId, colliderLayer: 0 }, // CL_NONE
					},
					{
						type: QuestCommandType.RemoveGltfComponent,
						params: { entityId },
					}
				)
				break
		}

		if (this.debugMode) {
			console.log(`Updated entity ${entityId} to state: ${state}`)
		}

		return commands
	}

	/**
	 * Get current location ID
	 */
	getCurrentLocationId(): string | undefined {
		return this.currentLocationId
	}
}
