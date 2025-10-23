// Shared utilities for frontend components

export interface ApiResponse {
	success: boolean
	error?: string
	commands?: any[]
	data?: any
}

// API IPC wrapper
export async function apiRequest(
	endpoint: string,
	options?: { method?: string; body?: any }
): Promise<ApiResponse> {
	try {
		const electronAPI = (window as any).electronAPI
		if (!electronAPI) {
			console.warn(
				'Electron API not available - this may indicate the app is running outside of Electron or the preload script failed to load'
			)
			return {
				success: false,
				error:
					'Electron API not available. This feature requires running in the Electron app.',
			}
		}

		console.log('Making IPC request:', endpoint, options)

		let result: any

		// Map endpoints to IPC handlers
		switch (endpoint) {
			case '/load':
				result = await electronAPI.loadGameData()
				break
			case '/save':
				result = await electronAPI.saveGameData(
					options?.body ? JSON.parse(options.body) : {}
				)
				break
			case '/generate-id':
				const idParams = options?.body ? JSON.parse(options.body) : {}
				result = await electronAPI.generateId(
					idParams.name,
					idParams.entityType,
					idParams.currentEntityId,
					idParams.prefix
				)
				break
			case '/start':
				result = await electronAPI.startGame()
				break
			case '/reset':
				result = await electronAPI.resetGame()
				break
			case '/interact':
				const interactParams = options?.body ? JSON.parse(options.body) : {}
				result = await electronAPI.processInteraction(
					interactParams.type,
					interactParams.params
				)
				break
			case '/dialogue':
				// Extract dialogueSequenceId from options if it's a POST request
				const dialogueParams = options?.body ? JSON.parse(options.body) : {}
				result = await electronAPI.getDialogue(
					dialogueParams.dialogueSequenceId
				)
				break
			case '/compile-data':
				result = await electronAPI.compileData()
				break
			case '/entityLinks':
				if (options?.method === 'PATCH') {
					const linkParams = options?.body ? JSON.parse(options.body) : {}
					result = await electronAPI.updateEntityLink(
						linkParams.entityId,
						linkParams.questEntityId
					)
				} else {
					result = await electronAPI.getEntityLinks()
				}
				break
			case '/thumbnails':
				result = await electronAPI.getThumbnails()
				break
			default:
				throw new Error(`Unknown endpoint: ${endpoint}`)
		}

		console.log('IPC response:', result)
		return result
	} catch (error) {
		console.error('IPC request failed:', error)
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error'
		return {
			success: false,
			error: `IPC request failed: ${errorMessage}`,
		}
	}
}

// Load game data
export async function loadGameData() {
	return apiRequest('/load')
}

// Save game data
export async function saveGameData(data: any) {
	return apiRequest('/save', {
		method: 'POST',
		body: JSON.stringify(data),
	})
}

// Generate unique ID from name using backend
export async function generateIdFromApi(
	name: string,
	entityType:
		| 'item'
		| 'npc'
		| 'location'
		| 'portal'
		| 'quest'
		| 'dialogue'
		| 'quest-step',
	currentEntityId?: string,
	prefix?: string
) {
	return apiRequest('/generate-id', {
		method: 'POST',
		body: JSON.stringify({ name, entityType, currentEntityId, prefix }),
	})
}

// Start game session
export async function startGame() {
	return apiRequest('/start', {
		method: 'POST',
	})
}

// Reset game session
export async function resetGame() {
	return apiRequest('/reset', {
		method: 'POST',
	})
}

// Send interaction
export async function sendInteraction(type: string, params: any) {
	return apiRequest('/interact', {
		method: 'POST',
		body: JSON.stringify({ type, params }),
	})
}

// Get dialogue sequence
export async function getDialogue(dialogueSequenceId: string) {
	return apiRequest('/dialogue', {
		method: 'POST',
		body: JSON.stringify({ dialogueSequenceId }),
	})
}

// Generate unique ID from name/title
export function generateIdFromName(
	name: string,
	entityType: 'item' | 'npc' | 'location' | 'portal' | 'quest'
): string {
	if (!name || name.trim() === '') {
		return generateId()
	}

	// Convert to lowercase and replace spaces/special chars with underscores
	let id = name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
		.replace(/[\s-]+/g, '_') // Replace spaces and hyphens with underscores
		.replace(/_+/g, '_') // Replace multiple underscores with single
		.replace(/^_|_$/g, '') // Remove leading/trailing underscores

	// Ensure minimum length
	if (id.length === 0) {
		id = 'unnamed'
	}

	return id
}

// Check if ID exists and generate unique version
export function generateUniqueId(
	name: string,
	entityType: 'item' | 'npc' | 'location' | 'portal' | 'quest',
	existingIds: string[]
): string {
	let baseId = generateIdFromName(name, entityType)
	let finalId = baseId
	let counter = 1

	// Keep incrementing counter until we find a unique ID
	while (existingIds.includes(finalId)) {
		finalId = `${baseId}_${counter}`
		counter++
	}

	return finalId
}

// Legacy random ID generator for notifications and other non-entity IDs
export function generateId(): string {
	return Math.random().toString(36).substr(2, 9)
}

// Execute commands on frontend
export function executeCommands(commands: any[]): void {
	commands.forEach((command) => {
		switch (command.type) {
			case 'playSound':
				playSound(command.params.url)
				break
			case 'spawnEntity':
				spawnEntity(command.params.id)
				break
			case 'clearEntity':
				clearEntity(command.params.id)
				break
			case 'updateLocation':
				updateLocation(command.params)
				break
			case 'changeBackground':
				changeBackground(command.params.image, command.params.music)
				break
			case 'updateInventory':
				updateInventory(command.params.inventory)
				break
			case 'questActivated':
				onQuestActivated(command.params.questId)
				break
			case 'questCompleted':
				onQuestCompleted(command.params.questId)
				break
			default:
				console.warn(`Unknown command type: ${command.type}`)
		}
	})
}

// Command execution functions (to be implemented by specific components)
function playSound(url: string): void {
	const audio = new Audio(url)
	audio.play().catch(console.error)
}

function spawnEntity(id: string): void {
	// Implementation depends on frontend component
	console.log(`Spawn entity: ${id}`)
}

function clearEntity(id: string): void {
	// Implementation depends on frontend component
	console.log(`Clear entity: ${id}`)
}

function changeBackground(image: string, music: string): void {
	// Implementation depends on frontend component
	console.log(`Change background: ${image}, music: ${music}`)
}

function updateInventory(inventory: Record<string, number>): void {
	// Implementation depends on frontend component
	console.log('Update inventory:', inventory)
}

function onQuestActivated(questId: string): void {
	console.log(`Quest activated: ${questId}`)
}

function onQuestCompleted(questId: string): void {
	console.log(`Quest completed: ${questId}`)
}

function updateLocation(locationData: any): void {
	// Implementation depends on frontend component
	console.log('Update location:', locationData)
}
