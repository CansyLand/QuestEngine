import express from 'express'
import fs from 'fs'
import path from 'path'
import { GameEngine } from './engine.js'
import { PersistenceManager } from './persistence.js'
import { ApiResponse, Game, Quest } from '../models'

// ID generation utilities
function generateIdFromName(
	name: string,
	entityType:
		| 'item'
		| 'npc'
		| 'location'
		| 'portal'
		| 'quest'
		| 'dialogue'
		| 'quest-step',
	prefix?: string
): string {
	if (!name || name.trim() === '') {
		return Math.random().toString(36).substr(2, 9)
	}

	// Convert to lowercase and replace spaces/special chars with underscores
	let nameId = name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
		.replace(/[\s-]+/g, '_') // Replace spaces and hyphens with underscores
		.replace(/_+/g, '_') // Replace multiple underscores with single
		.replace(/^_|_$/g, '') // Remove leading/trailing underscores

	// Ensure minimum length
	if (nameId.length === 0) {
		nameId = 'unnamed'
	}

	// For dialogue sequences, prefix with npcId if provided
	if (entityType === 'dialogue' && prefix) {
		return `${prefix}_${nameId}`
	}

	return nameId
}

function generateUniqueId(
	name: string,
	entityType:
		| 'item'
		| 'npc'
		| 'location'
		| 'portal'
		| 'quest'
		| 'dialogue'
		| 'quest-step',
	existingIds: string[],
	prefix?: string
): string {
	let baseId = generateIdFromName(name, entityType, prefix)
	let finalId = baseId
	let counter = 1

	// Keep incrementing counter until we find a unique ID
	while (existingIds.includes(finalId)) {
		finalId = `${baseId}_${counter}`
		counter++
	}

	return finalId
}

export function createApiRouter(
	engine: GameEngine,
	persistence: PersistenceManager
) {
	const router = express.Router()

	// Generate unique ID from name
	router.post('/generate-id', express.json(), (req, res) => {
		try {
			const { name, entityType, currentEntityId, prefix } = req.body

			if (!name || !entityType) {
				return res.status(400).json({
					success: false,
					error: 'Name and entityType are required',
				} as ApiResponse)
			}

			// Load current game data to check existing IDs
			const gameData = engine.getGameState()

			// Collect all existing IDs based on entity type
			let existingIds: string[] = []
			switch (entityType) {
				case 'item':
					existingIds = gameData.items.map((item) => item.id)
					break
				case 'npc':
					existingIds = gameData.npcs.map((npc) => npc.id)
					break
				case 'location':
					existingIds = gameData.locations.map((location) => location.id)
					break
				case 'portal':
					existingIds = gameData.portals.map((portal) => portal.id)
					break
				case 'quest':
					existingIds = gameData.quests.map((quest) => quest.id)
					break
				case 'dialogue':
					existingIds = gameData.dialogues.map((dialogue) => dialogue.id)
					break
				case 'quest-step':
					// Collect all quest step IDs from all quests
					existingIds = gameData.quests.flatMap((quest) =>
						quest.steps.map((step) => step.id)
					)
					break
				default:
					return res.status(400).json({
						success: false,
						error: 'Invalid entityType',
					} as ApiResponse)
			}

			// If we're editing an existing entity, don't count its current ID as taken
			if (currentEntityId) {
				existingIds = existingIds.filter((id) => id !== currentEntityId)
			}

			const newId = generateUniqueId(name, entityType, existingIds, prefix)

			const response: ApiResponse = {
				success: true,
				data: { id: newId },
			}
			res.json(response)
		} catch (error) {
			const response: ApiResponse = {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
			res.status(500).json(response)
		}
	})

	// Load game data for builder
	router.get('/load', (req, res) => {
		try {
			const gameData = engine.getGameState()

			// Clean up data - remove deprecated properties
			if (gameData.locations) {
				gameData.locations.forEach((location: any) => {
					if (location.backgroundImage) {
						delete location.backgroundImage
					}
				})
			}

			const response: ApiResponse = {
				success: true,
				data: gameData,
			}
			res.json(response)
		} catch (error) {
			const response: ApiResponse = {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
			res.status(500).json(response)
		}
	})

	// Update IDs when names change and handle references
	function updateEntityReferences(
		gameData: Game,
		entityType: string,
		oldId: string,
		newId: string
	): Game {
		const updatedData = JSON.parse(JSON.stringify(gameData)) // Deep clone

		// Update references in locations
		updatedData.locations.forEach((location: any) => {
			// Update item references
			location.items.forEach((item: any) => {
				if (item.onInteract) {
					item.onInteract.forEach((action: any) => {
						if (action.params && action.params.entityId === oldId) {
							action.params.entityId = newId
						}
						if (action.params && action.params.itemName === oldId) {
							action.params.itemName = newId
						}
					})
				}
			})

			// Update NPC references
			location.npcs.forEach((npc: any) => {
				if (npc.onInteract) {
					npc.onInteract.forEach((action: any) => {
						if (action.params && action.params.entityId === oldId) {
							action.params.entityId = newId
						}
						if (action.params && action.params.npcId === oldId) {
							action.params.npcId = newId
						}
					})
				}
			})

			// Update portal references
			location.portals.forEach((portal: any) => {
				if (portal.onInteract) {
					portal.onInteract.forEach((action: any) => {
						if (action.params && action.params.portalId === oldId) {
							action.params.portalId = newId
						}
						if (action.params && action.params.locationId === oldId) {
							action.params.locationId = newId
						}
					})
				}
				if (portal.destinationLocationId === oldId) {
					portal.destinationLocationId = newId
				}
			})
		})

		// Update quest references
		updatedData.quests.forEach((quest: any) => {
			quest.steps.forEach((step: any) => {
				if (step.onStart) {
					step.onStart.forEach((action: any) => {
						if (action.params) {
							if (action.params.entityId === oldId)
								action.params.entityId = newId
							if (action.params.itemName === oldId)
								action.params.itemName = newId
							if (action.params.npcId === oldId) action.params.npcId = newId
							if (action.params.portalId === oldId)
								action.params.portalId = newId
							if (action.params.locationId === oldId)
								action.params.locationId = newId
							if (action.params.questId === oldId) action.params.questId = newId
						}
					})
				}
				if (step.onComplete) {
					step.onComplete.forEach((action: any) => {
						if (action.params) {
							if (action.params.entityId === oldId)
								action.params.entityId = newId
							if (action.params.itemName === oldId)
								action.params.itemName = newId
							if (action.params.npcId === oldId) action.params.npcId = newId
							if (action.params.portalId === oldId)
								action.params.portalId = newId
							if (action.params.locationId === oldId)
								action.params.locationId = newId
							if (action.params.questId === oldId) action.params.questId = newId
						}
					})
				}
				if (step.objectiveParams) {
					if (step.objectiveParams.npcId === oldId)
						step.objectiveParams.npcId = newId
					if (step.objectiveParams.itemName === oldId)
						step.objectiveParams.itemName = newId
					if (step.objectiveParams.portalId === oldId)
						step.objectiveParams.portalId = newId
				}
			})
		})

		// Update dialogue sequence references in NPCs
		if (entityType === 'dialogue') {
			updatedData.npcs.forEach((npc: any) => {
				if (npc.dialogueSequences) {
					npc.dialogueSequences = npc.dialogueSequences.map(
						(dialogueId: string) => (dialogueId === oldId ? newId : dialogueId)
					)
				}
			})
		}

		// Update quest step references
		if (entityType === 'quest-step') {
			// Update activeStepId in quests
			updatedData.quests.forEach((quest: any) => {
				if (quest.activeStepId === oldId) {
					quest.activeStepId = newId
				}
			})

			// Update questStepId in dialogue sequences
			updatedData.dialogues.forEach((dialogue: any) => {
				if (dialogue.questStepId === oldId) {
					dialogue.questStepId = newId
				}
			})
		}

		return updatedData
	}

	// Save game data from builder
	router.post('/save', express.json(), async (req, res) => {
		try {
			let gameData = req.body
			console.log('API SAVE: Received gameData:', {
				locations: gameData.locations?.length || 0,
				quests: gameData.quests?.length || 0,
				npcs: gameData.npcs?.length || 0,
				items: gameData.items?.length || 0,
				portals: gameData.portals?.length || 0,
				dialogues: gameData.dialogues?.length || 0,
			})

			// Debug: Check for contamination in items array
			if (gameData.items) {
				const portalsInItems = gameData.items.filter(
					(item: any) => item.destinationLocationId
				)
				if (portalsInItems.length > 0) {
					console.warn(
						`API SAVE: Found ${portalsInItems.length} portals in items array before filtering:`,
						portalsInItems.map((p: any) => p.id)
					)
				}
			}

			// Debug: Check for contamination in portals array
			if (gameData.portals) {
				const itemsInPortals = gameData.portals.filter(
					(portal: any) => !portal.destinationLocationId
				)
				if (itemsInPortals.length > 0) {
					console.warn(
						`API SAVE: Found ${itemsInPortals.length} items in portals array before filtering:`,
						itemsInPortals.map((p: any) => p.id)
					)
				}
			}

			// Clean up data - remove deprecated properties and reset cleared states for save
			if (gameData.locations) {
				gameData.locations.forEach((location: any) => {
					if (location.backgroundImage) {
						delete location.backgroundImage
					}
					// Reset cleared states so items reappear on game restart
					if (location.items) {
						location.items.forEach((item: any) => {
							item.cleared = false
						})
					}
					if (location.npcs) {
						location.npcs.forEach((npc: any) => {
							npc.cleared = false
						})
					}
					if (location.portals) {
						location.portals.forEach((portal: any) => {
							portal.cleared = false
						})
					}
				})
			}

			// Clean up NPCs - remove deprecated portrait field
			if (gameData.npcs) {
				gameData.npcs.forEach((npc: any) => {
					if (npc.portrait) {
						delete npc.portrait
					}
				})
			}

			// Validate and clean up global entity arrays to prevent data contamination
			if (gameData.items) {
				// Filter out any portals that might have been mixed into items array
				gameData.items = gameData.items.filter(
					(item: any) => !item.destinationLocationId
				)
				console.log(
					`API SAVE: Filtered items array, now contains ${gameData.items.length} items`
				)
			}

			if (gameData.portals) {
				// Filter out any items that might have been mixed into portals array
				gameData.portals = gameData.portals.filter(
					(portal: any) => portal.destinationLocationId
				)
				console.log(
					`API SAVE: Filtered portals array, now contains ${gameData.portals.length} portals`
				)
			}

			// Load current state to detect ID changes
			const currentState = engine.getGameState()

			// Check for ID changes and update references
			const entityTypes = [
				{
					type: 'item',
					current: currentState.items,
					updated: gameData.items || [],
				},
				{
					type: 'npc',
					current: currentState.npcs,
					updated: gameData.npcs || [],
				},
				{
					type: 'location',
					current: currentState.locations,
					updated: gameData.locations || [],
				},
				{
					type: 'portal',
					current: currentState.portals,
					updated: gameData.portals || [],
				},
				{
					type: 'quest',
					current: currentState.quests,
					updated: gameData.quests || [],
				},
				{
					type: 'dialogue',
					current: currentState.dialogues,
					updated: gameData.dialogues || [],
				},
			]

			let hasIdChanges = false
			for (const { type, current, updated } of entityTypes) {
				for (const updatedEntity of updated) {
					const currentEntity = current.find(
						(e: any) => e.id === updatedEntity.id
					)
					if (currentEntity) {
						// Check if name changed for existing entity
						let nameChanged = false
						let oldName = ''
						let newName = ''

						if (type === 'quest') {
							const questCurrent = currentEntity as Quest
							const questUpdated = updatedEntity as Quest
							nameChanged = questCurrent.title !== questUpdated.title
							oldName = questCurrent.title
							newName = questUpdated.title
						} else {
							const nameCurrent = currentEntity as { name: string }
							const nameUpdated = updatedEntity as { name: string }
							nameChanged = nameCurrent.name !== nameUpdated.name
							oldName = nameCurrent.name
							newName = nameUpdated.name
						}

						if (nameChanged && updatedEntity.id !== currentEntity.id) {
							console.log(
								`ID change detected for ${type} ${currentEntity.id}: name changed from "${oldName}" to "${newName}", ID changed from "${currentEntity.id}" to "${updatedEntity.id}"`
							)
							hasIdChanges = true
							// Update references throughout the data
							gameData = updateEntityReferences(
								gameData,
								type,
								currentEntity.id,
								updatedEntity.id
							)
						}
					}
				}
			}

			// Check for quest step ID changes
			for (const updatedQuest of gameData.quests || []) {
				const currentQuest = currentState.quests.find(
					(q) => q.id === updatedQuest.id
				)
				if (currentQuest) {
					for (const updatedStep of updatedQuest.steps) {
						const currentStep = currentQuest.steps.find(
							(s) => s.id === updatedStep.id
						)
						if (
							currentStep &&
							currentStep.name !== updatedStep.name &&
							updatedStep.id !== currentStep.id
						) {
							console.log(
								`ID change detected for quest-step ${currentStep.id}: name changed from "${currentStep.name}" to "${updatedStep.name}", ID changed from "${currentStep.id}" to "${updatedStep.id}"`
							)
							hasIdChanges = true
							// Update references to the quest step ID
							gameData = updateEntityReferences(
								gameData,
								'quest-step',
								currentStep.id,
								updatedStep.id
							)
						}
					}
				}
			}

			if (hasIdChanges) {
				console.log('ID references have been updated due to name changes')
			}

			// Update engine state and save to files
			// Note: In a full implementation, you'd want to validate the data
			// Create a game object and save it, which will also compile to data.ts
			const gameToSave = {
				locations: gameData.locations || [],
				quests: gameData.quests || [],
				npcs: gameData.npcs || [],
				items: gameData.items || [],
				portals: gameData.portals || [],
				dialogues: gameData.dialogues || [],
				currentLocationId: gameData.currentLocationId || '',
				activeQuests: gameData.activeQuests || [],
				inventory: gameData.inventory || [],
			}

			console.log('API SAVE: About to call persistence.saveGame()')
			await persistence.saveGame(gameToSave)
			console.log('API SAVE: saveGame completed')

			// Reload the engine state from the updated files
			engine.loadGame()

			// Get the updated state to verify it worked
			const updatedState = engine.getGameState()
			console.log('API SAVE: Updated engine state:', {
				locations: updatedState.locations?.length || 0,
				quests: updatedState.quests?.length || 0,
				npcs: updatedState.npcs?.length || 0,
				items: updatedState.items?.length || 0,
				portals: updatedState.portals?.length || 0,
				dialogues: updatedState.dialogues?.length || 0,
			})

			const response: ApiResponse = {
				success: true,
				data: updatedState,
			}
			res.json(response)
		} catch (error) {
			console.error('API SAVE ERROR:', error)
			const response: ApiResponse = {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
			res.status(500).json(response)
		}
	})

	// Start game session for player
	router.post('/start', (req, res) => {
		try {
			const commands = engine.start()
			const response: ApiResponse = {
				success: true,
				commands,
			}
			res.json(response)
		} catch (error) {
			const response: ApiResponse = {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
			res.status(500).json(response)
		}
	})

	// Process player interactions
	router.post('/interact', express.json(), (req, res) => {
		try {
			const { type, params } = req.body
			const commands = engine.processInteraction(type, params)
			const response: ApiResponse = {
				success: true,
				commands,
			}
			res.json(response)
		} catch (error) {
			const response: ApiResponse = {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
			res.status(500).json(response)
		}
	})

	// Reset game session for player
	router.post('/reset', (req, res) => {
		try {
			const commands = engine.reset()
			const response: ApiResponse = {
				success: true,
				commands,
			}
			res.json(response)
		} catch (error) {
			const response: ApiResponse = {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
			res.status(500).json(response)
		}
	})

	// Get dialogue sequence for player
	router.post('/dialogue', express.json(), (req, res) => {
		try {
			const { dialogueSequenceId } = req.body
			const gameState = engine.getGameState()
			const dialogue = gameState.dialogues.find(
				(d) => d.id === dialogueSequenceId
			)

			if (!dialogue) {
				return res.status(404).json({
					success: false,
					error: 'Dialogue sequence not found',
				} as ApiResponse)
			}

			// Get NPC image for the dialogue
			const npc = gameState.npcs.find((n) => n.id === dialogue.npcId)
			const npcImage = npc?.image || null

			const response: ApiResponse = {
				success: true,
				data: {
					...dialogue,
					npcImage,
				},
			}
			res.json(response)
		} catch (error) {
			const response: ApiResponse = {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
			res.status(500).json(response)
		}
	})

	// Get entity links
	router.get('/entityLinks', (req, res) => {
		try {
			const linksPath = path.join(
				process.cwd(),
				'questEditor/data/entityLinks.json'
			)
			if (fs.existsSync(linksPath)) {
				const data = JSON.parse(fs.readFileSync(linksPath, 'utf8'))
				res.json(data)
			} else {
				res.json({})
			}
		} catch (error) {
			res.status(500).json({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	})

	// Update entity link
	router.patch('/entityLinks/:entityId', express.json(), async (req, res) => {
		try {
			const { entityId } = req.params
			const { questEntityId } = req.body
			const linksPath = path.join(
				process.cwd(),
				'questEditor/data/entityLinks.json'
			)
			let data: Record<string, any> = {}
			if (fs.existsSync(linksPath)) {
				data = JSON.parse(fs.readFileSync(linksPath, 'utf8'))
			}
			if (data[entityId]) {
				console.log(
					`API: Updating entity ${entityId} questEntityId to ${questEntityId}`
				)
				data[entityId].questEntityId = questEntityId

				console.log('API: Writing entityLinks.json file...')
				fs.writeFileSync(linksPath, JSON.stringify(data, null, 2))
				console.log('API: entityLinks.json file write completed')

				// Small delay to ensure file is fully written and committed
				await new Promise((resolve) => setTimeout(resolve, 100))

				// After updating entity links, recompile TypeScript data
				try {
					await persistence.compileDataToTypescript()
					console.log(
						'✅ Entity links updated and TypeScript compilation completed'
					)
				} catch (compileError) {
					console.error(
						'❌ Failed to compile TypeScript after entity link update:',
						compileError
					)
					// Don't fail the request if compilation fails, but log the error
				}

				res.json({ success: true })
			} else {
				res.status(404).json({ success: false, error: 'Entity not found' })
			}
		} catch (error) {
			res.status(500).json({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	})

	// Get thumbnail images from DCL projects and assets/images
	router.get('/thumbnails', (req, res) => {
		try {
			const dclProjectsPath = path.join(process.cwd(), '..')
			const images: Array<{ name: string; url: string; project: string }> = []

			// First, load images from assets/images directory
			const assetsImagesPath = path.join(
				__dirname,
				'../../frontend/public/assets/images'
			)
			if (fs.existsSync(assetsImagesPath)) {
				try {
					const imageFiles = fs.readdirSync(assetsImagesPath).filter((file) => {
						const ext = path.extname(file).toLowerCase()
						return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)
					})

					// Add each image to the images array
					for (const fileName of imageFiles) {
						const url = `/assets/images/${fileName}`
						images.push({
							name: fileName,
							url: url,
							project: 'assets',
						})
					}
				} catch (error) {
					console.warn('Failed to read images from assets/images:', error)
				}
			}

			// Check if the DCL projects directory exists
			if (!fs.existsSync(dclProjectsPath)) {
				const response: ApiResponse = {
					success: true,
					data: images,
				}
				return res.json(response)
			}

			// Get all directories in the DCL projects folder
			const projectDirs = fs
				.readdirSync(dclProjectsPath, { withFileTypes: true })
				.filter((dirent) => dirent.isDirectory())
				.map((dirent) => dirent.name)

			// For each project directory, look for thumbnails folder
			for (const projectName of projectDirs) {
				const projectPath = path.join(dclProjectsPath, projectName)
				const scenePath = path.join(projectPath, 'scene')
				const thumbnailsPath = path.join(scenePath, 'thumbnails')

				// Check if thumbnails folder exists
				if (fs.existsSync(thumbnailsPath)) {
					try {
						const thumbnailFiles = fs
							.readdirSync(thumbnailsPath)
							.filter((file) => {
								const ext = path.extname(file).toLowerCase()
								return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)
							})

						// Add each thumbnail to the images array
						for (const fileName of thumbnailFiles) {
							const filePath = path.join(thumbnailsPath, fileName)
							// Create a URL that serves the file - we'll need to add a static route for this
							const url = `/api/thumbnails/${projectName}/${fileName}`
							images.push({
								name: fileName,
								url: url,
								project: projectName,
							})
						}
					} catch (error) {
						console.warn(
							`Failed to read thumbnails from ${projectName}:`,
							error
						)
					}
				}
			}

			const response: ApiResponse = {
				success: true,
				data: images,
			}
			res.json(response)
		} catch (error) {
			const response: ApiResponse = {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
			res.status(500).json(response)
		}
	})

	return router
}
