import * as path from 'path'
import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import { PersistenceManager } from '../../core/services/persistence/PersistenceManager'
import { GameEngine } from '../../core/engine/GameEngine'

export class QuestEngineService {
	private engine: GameEngine | null = null
	private persistence: PersistenceManager
	private projectPath: string | null = null
	private sceneWatcher: fs.FSWatcher | null = null

	constructor() {
		// Initialize backend components
		this.persistence = new PersistenceManager('')
	}

	/**
	 * Set the active project path and update data directory
	 */
	async setProjectPath(projectPath: string): Promise<void> {
		console.log('QuestEngineService: Setting project path to:', projectPath)

		// Stop existing file watcher
		this.stopFileWatching()

		this.projectPath = projectPath
		await this.updateDataDirectory(projectPath)
		await this.initializeEngine()

		// Start file watching for scene changes
		this.startFileWatching(projectPath)

		console.log('QuestEngineService: Project path set successfully')
	}

	/**
	 * Get the current project path
	 */
	getProjectPath(): string | null {
		return this.projectPath
	}

	/**
	 * Initialize the game engine after setting the project path
	 */
	private async initializeEngine(): Promise<void> {
		try {
			// Initialize the real game engine
			this.engine = new GameEngine(this.persistence)
			await this.engine.initializeGame()
			console.log('QuestEngineService: Engine initialized successfully')
		} catch (error) {
			console.error('QuestEngineService: Failed to initialize engine:', error)
			throw error
		}
	}

	/**
	 * Update the persistence manager's data directory
	 */
	private async updateDataDirectory(projectPath: string): Promise<void> {
		const dataDir = path.join(projectPath, 'src/questEngine/data')

		// Create new persistence instance with the project-specific data directory
		this.persistence = new PersistenceManager(dataDir)
	}

	/**
	 * Get game data for loading in the editor
	 */
	async loadGameData(): Promise<any> {
		try {
			if (!this.engine) {
				throw new Error('Engine not initialized')
			}
			const gameData = this.engine.getGameState()

			// Clean up data - remove deprecated properties
			if (gameData.locations) {
				gameData.locations.forEach((location: any) => {
					if (location.backgroundImage) {
						delete location.backgroundImage
					}
				})
			}

			return {
				success: true,
				data: gameData,
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	/**
	 * Save game data from the editor
	 */
	async saveGameData(data: any): Promise<any> {
		try {
			if (!this.engine) {
				throw new Error('Engine not initialized')
			}

			// Clean up data - remove deprecated properties and reset cleared states
			if (data.locations) {
				data.locations.forEach((location: any) => {
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
			if (data.npcs) {
				data.npcs.forEach((npc: any) => {
					if (npc.portrait) {
						delete npc.portrait
					}
				})
			}

			// Validate and clean up global entity arrays
			if (data.items) {
				data.items = data.items.filter(
					(item: any) => !item.destinationLocationId
				)
			}

			if (data.portals) {
				data.portals = data.portals.filter(
					(portal: any) => portal.id && portal.name
				)
			}

			// Update engine state and save to files
			const gameToSave = {
				locations: data.locations || [],
				quests: data.quests || [],
				npcs: data.npcs || [],
				items: data.items || [],
				portals: data.portals || [],
				dialogues: data.dialogues || [],
				currentLocationId: data.currentLocationId || '',
				activeQuests: data.activeQuests || [],
				inventory: data.inventory || [],
			}

			await this.persistence.saveGame(gameToSave)
			await this.engine.initializeGame() // Reload the engine state

			return {
				success: true,
				data: this.engine.getGameState(),
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	/**
	 * Get specific data type
	 */
	async getQuestData(dataType: string): Promise<any> {
		if (!this.persistence) return null

		switch (dataType) {
			case 'quests':
				return await this.persistence.loadQuests()
			case 'npcs':
				return await this.persistence.loadNPCs()
			case 'items':
				return await this.persistence.loadItems()
			case 'locations': {
				const items = await this.persistence.loadItems()
				const npcs = await this.persistence.loadNPCs()
				const portals = await this.persistence.loadPortals()
				return await this.persistence.loadLocations(items, npcs, portals)
			}
			case 'portals':
				return await this.persistence.loadPortals()
			case 'dialogues':
				return await this.persistence.loadDialogues()
			case 'game':
				return await this.persistence.loadGame()
			default:
				return null
		}
	}

	/**
	 * Save specific data type
	 */
	async saveQuestData(dataType: string, data: any): Promise<void> {
		if (!this.persistence) return

		switch (dataType) {
			case 'quests':
				return await this.persistence.saveQuests(data)
			case 'npcs':
				return await this.persistence.saveNPCs(data)
			case 'items':
				return await this.persistence.saveItems(data)
			case 'locations':
				return await this.persistence.saveLocations(data)
			case 'portals':
				return await this.persistence.savePortals(data)
			case 'dialogues':
				return await this.persistence.saveDialogues(data)
			case 'entityLinks':
				// Fix: Property 'saveEntityLinks' does not exist on type 'PersistenceManager'.
				// EntityLinks are handled separately via getEntityLinks() and updateEntityLink() methods
				// which directly read/write to entityLinks.json file
				return
			case 'game':
				return await this.persistence.saveGame(data)
		}
	}

	/**
	 * Generate unique ID
	 */
	generateId(
		name: string,
		entityType: string,
		existingIds: string[],
		prefix?: string
	): string {
		function generateIdFromName(
			name: string,
			entityType: string,
			prefix?: string
		): string {
			if (!name || name.trim() === '') {
				return Math.random().toString(36).substr(2, 9)
			}

			let nameId = name
				.toLowerCase()
				.trim()
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/[\s-]+/g, '_')
				.replace(/_+/g, '_')
				.replace(/^_|_$/g, '')

			if (nameId.length === 0) {
				nameId = 'unnamed'
			}

			if (entityType === 'dialogue' && prefix) {
				return `${prefix}_${nameId}`
			}

			return nameId
		}

		function generateUniqueId(
			name: string,
			entityType: string,
			existingIds: string[],
			prefix?: string
		): string {
			let baseId = generateIdFromName(name, entityType, prefix)
			let finalId = baseId
			let counter = 1

			while (existingIds.includes(finalId)) {
				finalId = `${baseId}_${counter}`
				counter++
			}

			return finalId
		}

		return generateUniqueId(name, entityType, existingIds, prefix)
	}

	/**
	 * Get thumbnails from project directories
	 */
	async getThumbnails(): Promise<any> {
		try {
			if (!this.projectPath) {
				return { success: false, error: 'No project loaded' }
			}

			const images: Array<{ name: string; url: string; project: string }> = []

			// Helper function to read directory recursively
			const findImageFiles = (
				dirPath: string,
				relativePath: string = ''
			): void => {
				try {
					const items = fs.readdirSync(dirPath, { withFileTypes: true })

					for (const item of items) {
						const itemPath = path.join(dirPath, item.name)
						const itemRelativePath = relativePath
							? `${relativePath}/${item.name}`
							: item.name

						if (item.isDirectory()) {
							findImageFiles(itemPath, itemRelativePath)
						} else if (item.isFile()) {
							const ext = path.extname(item.name).toLowerCase()
							if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
								images.push({
									name: itemRelativePath,
									url: itemPath, // Full file path for reading via IPC
									project: path.basename(this.projectPath!),
								})
							}
						}
					}
				} catch (error) {
					console.warn(`Failed to read directory ${dirPath}:`, error)
				}
			}

			// Check project thumbnail directories
			const thumbnailLocations = [
				path.join(this.projectPath, 'thumbnails'),
				path.join(this.projectPath, 'scene', 'thumbnails'),
			]

			for (const thumbnailsPath of thumbnailLocations) {
				try {
					const items = fs.readdirSync(thumbnailsPath, { withFileTypes: true })
					for (const item of items) {
						if (item.isFile()) {
							const ext = path.extname(item.name).toLowerCase()
							if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
								images.push({
									name: item.name,
									url: path.join(thumbnailsPath, item.name),
									project: path.basename(this.projectPath),
								})
							}
						}
					}
				} catch (error) {
					// Directory doesn't exist, continue
				}
			}

			// Check assets/images with recursive search
			const projectAssetsImagesPath = path.join(
				this.projectPath,
				'assets',
				'images'
			)
			findImageFiles(projectAssetsImagesPath)

			return {
				success: true,
				data: images,
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	/**
	 * Read thumbnail file as base64
	 */
	async readThumbnail(filePath: string): Promise<string | null> {
		try {
			// Security check: ensure the file is within allowed directories
			const allowedDirs = [
				path.join(this.projectPath!, 'thumbnails'),
				path.join(this.projectPath!, 'scene', 'thumbnails'),
				path.join(this.projectPath!, 'assets', 'images'),
			]

			const isAllowed = allowedDirs.some((dir) => filePath.startsWith(dir))
			if (!isAllowed) {
				throw new Error('Access denied')
			}

			const buffer = await fsPromises.readFile(filePath)
			const ext = path.extname(filePath).toLowerCase()
			const mimeType =
				{
					'.png': 'image/png',
					'.jpg': 'image/jpeg',
					'.jpeg': 'image/jpeg',
					'.gif': 'image/gif',
					'.webp': 'image/webp',
				}[ext] || 'application/octet-stream'

			return `data:${mimeType};base64,${buffer.toString('base64')}`
		} catch (error) {
			console.error('Error reading thumbnail:', error)
			return null
		}
	}

	/**
	 * Start game session for player
	 */
	startGame(): any {
		try {
			if (!this.engine) {
				throw new Error('Engine not initialized')
			}
			const commands = this.engine.start()
			return {
				success: true,
				commands,
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	/**
	 * Process player interactions
	 */
	processInteraction(type: string, params: any): any {
		try {
			if (!this.engine) {
				throw new Error('Engine not initialized')
			}
			const commands = this.engine.processInteraction(type, params)
			return {
				success: true,
				commands,
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	/**
	 * Reset game session
	 */
	resetGame(): any {
		try {
			if (!this.engine) {
				throw new Error('Engine not initialized')
			}
			const commands = this.engine.reset()
			return {
				success: true,
				commands,
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	/**
	 * Get dialogue sequence for player
	 */
	getDialogue(dialogueSequenceId: string): any {
		try {
			if (!this.engine) {
				throw new Error('Engine not initialized')
			}
			const gameState = this.engine.getGameState()
			const dialogue = gameState.dialogues.find(
				(d: any) => d.id === dialogueSequenceId
			)

			if (!dialogue) {
				return {
					success: false,
					error: 'Dialogue sequence not found',
				}
			}

			const npc = gameState.npcs.find((n: any) => n.id === dialogue.npcId)
			const npcImage = npc?.image || null

			return {
				success: true,
				data: {
					...dialogue,
					npcImage,
				},
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	/**
	 * Compile data to TypeScript
	 */
	async compileData(): Promise<any> {
		try {
			await this.persistence.compileDataToTypescript()
			return { success: true }
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	/**
	 * Get entity links
	 */
	async getEntityLinks(): Promise<any> {
		try {
			const linksPath = path.join(this.projectPath!, 'entityLinks.json')
			try {
				await fsPromises.access(linksPath)
				const data = await fsPromises.readFile(linksPath, 'utf8')
				return JSON.parse(data)
			} catch {
				return {}
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	/**
	 * Update entity link
	 */
	async updateEntityLink(
		entityId: string,
		questEntityId: string
	): Promise<any> {
		try {
			const linksPath = path.join(this.projectPath!, 'entityLinks.json')
			let data: Record<string, any> = {}

			try {
				await fsPromises.access(linksPath)
				const fileData = await fsPromises.readFile(linksPath, 'utf8')
				data = JSON.parse(fileData)
			} catch (error) {
				// File doesn't exist or can't be read, use empty object
			}

			if (data[entityId]) {
				data[entityId].questEntityId = questEntityId
				await fsPromises.writeFile(linksPath, JSON.stringify(data, null, 2))

				// Recompile TypeScript data
				try {
					await this.persistence.compileDataToTypescript()
				} catch (compileError) {
					console.error(
						'Failed to compile TypeScript after entity link update:',
						compileError
					)
				}

				return { success: true }
			} else {
				return { success: false, error: 'Entity not found' }
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	/**
	 * Start watching for file changes in the DCL scene
	 */
	private startFileWatching(projectPath: string): void {
		const compositePath = path.join(projectPath, 'assets/scene/main.composite')
		const linksPath = path.join(
			projectPath,
			'src/questEngine/data/entityLinks.json'
		)

		let lastHash: string | null = null

		// Check if composite file exists and get initial hash
		try {
			if (fs.existsSync(compositePath)) {
				const compositeData = JSON.parse(fs.readFileSync(compositePath, 'utf8'))
				lastHash = this.computeHash(compositeData)
			}
		} catch (error) {
			console.warn('Could not read initial composite file:', error)
		}

		this.sceneWatcher = fs.watch(
			compositePath,
			{ persistent: true },
			async (eventType) => {
				if (eventType === 'change') {
					try {
						const compositeData = JSON.parse(
							fs.readFileSync(compositePath, 'utf8')
						)
						const currentHash = this.computeHash(compositeData)

						if (currentHash !== lastHash) {
							lastHash = currentHash
							const newLinks = this.extractEntityData(compositeData)
							await this.updateEntityLinks(newLinks, linksPath)
							console.log('DCL scene entities updated in project:', projectPath)
						}
					} catch (error) {
						console.warn('Error processing composite file change:', error)
					}
				}
			}
		)

		console.log('Native file watching started for project:', projectPath)
		console.log('Watching file:', compositePath)
		console.log('Will update:', linksPath)
	}

	/**
	 * Stop file watching
	 */
	private stopFileWatching(): void {
		if (this.sceneWatcher) {
			this.sceneWatcher.close()
			this.sceneWatcher = null
			console.log('File watching stopped')
		}
	}

	/**
	 * Compute hash for change detection
	 */
	private computeHash(data: any): string {
		const transformData =
			data.components?.find((c: any) => c.name === 'core::Transform')?.data ||
			{}
		const nameData =
			data.components?.find((c: any) => c.name === 'core-schema::Name')?.data ||
			{}

		const entities = Object.keys(transformData)
		let hashData = entities.length.toString()

		const sortedEntities = entities.sort()

		sortedEntities.forEach((entityId) => {
			const transform = transformData[entityId]?.json
			const name = nameData[entityId]?.json?.value

			if (transform) {
				hashData += `${entityId}:${transform.position?.x || 0},${
					transform.position?.y || 0
				},${transform.position?.z || 0}`
			}
			if (name) {
				hashData += `:${name}`
			}
		})

		return hashData
	}

	/**
	 * Extract entity data from composite
	 */
	private extractEntityData(compositeData: any) {
		const links: Record<string, any> = {}
		const transformData =
			compositeData.components?.find((c: any) => c.name === 'core::Transform')
				?.data || {}
		const nameData =
			compositeData.components?.find((c: any) => c.name === 'core-schema::Name')
				?.data || {}

		for (const entityId of Object.keys(transformData)) {
			if (nameData[entityId]) {
				const transform = transformData[entityId].json
				const name = nameData[entityId].json.value
				links[entityId] = {
					position: transform.position || { x: 0, y: 0, z: 0 },
					parent: transform.parent || 0,
					name: name || 'Unknown',
					questEntityId: null,
				}
			}
		}
		return links
	}

	/**
	 * Update entity links file
	 */
	private async updateEntityLinks(
		newLinks: Record<string, any>,
		linksPath: string
	): Promise<void> {
		let existingLinks: Record<string, any> = {}
		try {
			if (fs.existsSync(linksPath)) {
				const data = fs.readFileSync(linksPath, 'utf8')
				existingLinks = JSON.parse(data)
			}
		} catch (error) {
			console.error('Error reading existing links:', error)
		}

		const updatedLinks: Record<string, any> = {}

		// Process existing entities
		for (const entityId in existingLinks) {
			const existingEntity = existingLinks[entityId]

			if (newLinks[entityId]) {
				// Entity still exists, update with new data
				updatedLinks[entityId] = {
					...newLinks[entityId],
					questEntityId: existingEntity.questEntityId, // Preserve existing quest entity links
				}
			} else {
				// Entity was removed
				console.log(
					`Removing entity ${entityId} (${existingEntity.name}) from entityLinks.json`
				)
			}
		}

		// Add new entities
		for (const entityId in newLinks) {
			if (!existingLinks[entityId]) {
				updatedLinks[entityId] = newLinks[entityId]
				console.log(
					`Adding new entity ${entityId} (${newLinks[entityId].name}) to entityLinks.json`
				)
			}
		}

		// Write back to file
		try {
			await fs.promises.writeFile(
				linksPath,
				JSON.stringify(updatedLinks, null, 2)
			)
		} catch (error) {
			console.error('Error writing links file:', error)
		}
	}
}
