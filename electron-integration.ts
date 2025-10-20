import express from 'express'
import cors from 'cors'
import * as path from 'path'
import * as fs from 'fs/promises'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'
import { app } from 'electron'
// Removed imports from backend files to avoid compilation issues
import { BrowserWindow } from 'electron'
import {
	Game,
	Location,
	SavedLocation,
	Quest,
	NPC,
	Item,
	Portal,
	DialogueSequence,
} from './src/questEditor/models'

class ElectronPersistenceManager {
	private dataDir: string

	constructor(dataDir: string) {
		this.dataDir = dataDir
	}

	private async ensureDataDir(): Promise<void> {
		try {
			await fs.mkdir(this.dataDir, { recursive: true })
		} catch (error) {
			// Directory already exists or other error, ignore
		}
	}

	private getFilePath(filename: string): string {
		return path.join(this.dataDir, filename)
	}

	async loadQuests(): Promise<Quest[]> {
		try {
			const filePath = this.getFilePath('quests.json')
			const data = await fs.readFile(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading quests:', error)
			return []
		}
	}

	async saveQuests(quests: Quest[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('quests.json')
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(quests, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadLocations(
		items: Item[],
		npcs: NPC[],
		portals: Portal[]
	): Promise<Location[]> {
		try {
			const filePath = this.getFilePath('locations.json')
			const data = await fs.readFile(filePath, 'utf-8')
			const savedLocations = JSON.parse(data) as SavedLocation[]

			return savedLocations.map((location) => ({
				...location,
				items: location.items
					.map((itemId: string) => items.find((i) => i.id === itemId))
					.filter(Boolean) as Item[],
				npcs: location.npcs
					.map((npcId: string) => npcs.find((n) => n.id === npcId))
					.filter(Boolean) as NPC[],
				portals: location.portals
					.map((portalId: string) => portals.find((p) => p.id === portalId))
					.filter(Boolean) as Portal[],
			}))
		} catch (error) {
			console.error('Error loading locations:', error)
			return []
		}
	}

	async saveLocations(locations: Location[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('locations.json')
		const savedLocations: SavedLocation[] = locations.map((location) => ({
			id: location.id,
			name: location.name,
			backgroundMusic: location.backgroundMusic,
			image: location.image,
			items: location.items.map((item) => item.id),
			npcs: location.npcs.map((npc) => npc.id),
			portals: location.portals.map((portal) => portal.id),
		}))

		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(savedLocations, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadNPCs(): Promise<NPC[]> {
		try {
			const filePath = this.getFilePath('npcs.json')
			const data = await fs.readFile(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading NPCs:', error)
			return []
		}
	}

	async saveNPCs(npcs: NPC[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('npcs.json')
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(npcs, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadItems(): Promise<Item[]> {
		try {
			const filePath = this.getFilePath('items.json')
			const data = await fs.readFile(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading items:', error)
			return []
		}
	}

	async saveItems(items: Item[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('items.json')
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(items, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadPortals(): Promise<Portal[]> {
		try {
			const filePath = this.getFilePath('portals.json')
			const data = await fs.readFile(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading portals:', error)
			return []
		}
	}

	async savePortals(portals: Portal[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('portals.json')
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(portals, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadDialogues(): Promise<DialogueSequence[]> {
		try {
			const filePath = this.getFilePath('dialogues.json')
			const data = await fs.readFile(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading dialogues:', error)
			return []
		}
	}

	async saveDialogues(dialogues: DialogueSequence[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('dialogues.json')
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(dialogues, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadEntityLinks(): Promise<Record<string, any>> {
		try {
			const filePath = this.getFilePath('entityLinks.json')
			const data = await fs.readFile(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading entity links:', error)
			return {}
		}
	}

	async saveEntityLinks(entityLinks: Record<string, any>): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('entityLinks.json')
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(entityLinks, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadGame(): Promise<Game> {
		const quests = await this.loadQuests()
		const npcs = await this.loadNPCs()
		const items = await this.loadItems()
		const portals = await this.loadPortals()
		const dialogues = await this.loadDialogues()
		const locations = await this.loadLocations(items, npcs, portals)

		// Create default game state
		const myceliumCaves = locations.find((l) => l.id === 'mycelium_caves')
		return {
			locations,
			quests,
			npcs,
			items,
			portals,
			dialogues,
			currentLocationId: myceliumCaves
				? myceliumCaves.id
				: locations.length > 0
				? locations[0].id
				: '',
			activeQuests: [],
			inventory: [],
		}
	}

	async saveGame(game: Game): Promise<void> {
		await this.saveLocations(game.locations)
		await this.saveQuests(game.quests)
		await this.saveNPCs(game.npcs)
		await this.saveItems(game.items)
		await this.savePortals(game.portals)
		await this.saveDialogues(game.dialogues)

		// Compile data after all saves are complete
		await this.compileDataToTypescript()
	}

	async compileDataToTypescript(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				console.log('🔄 Starting data compilation for project...')
				// Get the application directory (works for both dev and packaged apps)
				const appPath = app.getAppPath()
				const scriptPath = path.resolve(
					appPath,
					'src/questEditor/backend/generate-data.js'
				)
				const workingDir = path.dirname(this.dataDir) // src/questEngine/
				const command = `cd "${workingDir}" && node "${scriptPath}"`

				console.log('App path:', appPath)
				console.log('Script path:', scriptPath)
				console.log('Working directory:', workingDir)
				console.log('Command:', command)

				exec(command, (error, stdout, stderr) => {
					if (stdout) console.log('Data compilation output:', stdout)
					if (stderr) console.log('Data compilation stderr:', stderr)

					if (error) {
						console.error('❌ Data compilation failed:', error)
						reject(error)
					} else {
						console.log('✅ Data compilation completed successfully')
						resolve()
					}
				})
			} catch (error) {
				console.error('❌ Error compiling data to TypeScript:', error)
				reject(error)
			}
		})
	}
}

export class QuestEditorIntegration {
	private app: express.Application
	private server: any
	private engine: any = null
	private persistence: ElectronPersistenceManager
	private projectPath: string | null = null
	private sceneMonitoringInterval: NodeJS.Timeout | null = null

	constructor() {
		this.app = express()
		this.app.use(cors())
		this.app.use(express.json())

		// Initialize backend components
		this.persistence = new ElectronPersistenceManager('')

		// Engine will be initialized when project path is set
		// API routes will be mounted after engine initialization

		// Setup static file serving for project assets
		this.setupStaticRoutes()
	}

	/**
	 * Set the active project path and update data directory
	 */
	async setProjectPath(projectPath: string): Promise<void> {
		console.log('QuestEditorIntegration: Setting project path to:', projectPath)
		this.projectPath = projectPath
		await this.updateDataDirectory(projectPath)
		await this.initializeEngine()
		this.setupSceneMonitoring(projectPath)
		this.setupStaticRoutes() // Update static routes for new project
		console.log('QuestEditorIntegration: Project path set successfully')
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
		// For now, create a simple mock engine that delegates to persistence
		// In a full implementation, we'd modify GameEngine to be async-compatible
		this.engine = {
			getGame: async () => await this.persistence.loadGame(),
			saveGame: async (game: any) => await this.persistence.saveGame(game),
			// Add other methods as needed for the API
		} as any

		// Create a simple API router that works with our persistence
		this.setupApiRoutes()
	}

	/**
	 * Setup static file serving for project assets
	 */
	private setupStaticRoutes(): void {
		// Add static serving for project assets if project path is set
		if (this.projectPath) {
			const assetsPath = path.join(this.projectPath, 'assets')
			console.log('Setting up static serving for assets at:', assetsPath)
			console.log(
				'Assets directory exists:',
				require('fs').existsSync(assetsPath)
			)
			this.app.use('/assets', express.static(assetsPath))
		}
	}

	/**
	 * Setup API routes for questEditor
	 */
	private setupApiRoutes(): void {
		const router = express.Router()
		const self = this // Capture 'this' context

		// Game data endpoint (legacy)
		router.get('/game', async (req, res) => {
			try {
				const game = await this.persistence.loadGame()
				res.json(game)
			} catch (error) {
				res.status(500).json({ error: 'Failed to load game data' })
			}
		})

		// Load game data endpoint (used by Builder)
		router.get('/load', async (req, res) => {
			try {
				const game = await this.persistence.loadGame()
				res.json({ success: true, data: game })
			} catch (error) {
				console.error('Error loading game data:', error)
				res.json({
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				})
			}
		})

		// Save game data endpoint (used by Builder)
		router.post('/save', async (req, res) => {
			try {
				const gameData = req.body
				await this.persistence.saveGame(gameData)
				res.json({ success: true })
			} catch (error) {
				console.error('Error saving game data:', error)
				res.json({
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				})
			}
		})

		// Generate ID endpoint
		router.post('/generate-id', async (req, res) => {
			try {
				const { name, entityType, currentEntityId, prefix } = req.body
				// For now, generate a simple ID. In the future, this could use the backend's ID generation
				const id = `${entityType}_${Date.now()}_${Math.random()
					.toString(36)
					.substr(2, 9)}`
				res.json({ success: true, data: id })
			} catch (error) {
				res.json({
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				})
			}
		})

		// Start game session endpoint
		router.post('/start', async (req, res) => {
			try {
				// Initialize game session if needed
				res.json({ success: true })
			} catch (error) {
				res.json({
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				})
			}
		})

		// Reset game session endpoint
		router.post('/reset', async (req, res) => {
			try {
				// Reset game session logic
				res.json({ success: true })
			} catch (error) {
				res.json({
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				})
			}
		})

		// Interact endpoint
		router.post('/interact', async (req, res) => {
			try {
				const { type, params } = req.body
				// Handle interaction logic
				res.json({ success: true })
			} catch (error) {
				res.json({
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				})
			}
		})

		// Quests endpoints
		router.get('/quests', async (req, res) => {
			try {
				const quests = await this.persistence.loadQuests()
				res.json(quests)
			} catch (error) {
				res.status(500).json({ error: 'Failed to load quests' })
			}
		})

		router.post('/quests', async (req, res) => {
			try {
				await this.persistence.saveQuests(req.body)
				res.json({ success: true })
			} catch (error) {
				res.status(500).json({ error: 'Failed to save quests' })
			}
		})

		// EntityLinks endpoints
		router.get('/entityLinks', async (req, res) => {
			try {
				const entityLinks = await this.persistence.loadEntityLinks()
				res.json({ success: true, data: entityLinks })
			} catch (error) {
				console.error('Error loading entityLinks:', error)
				res.json({
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				})
			}
		})

		router.patch('/entityLinks/:entityId', async (req, res) => {
			try {
				const { entityId } = req.params
				const updateData = req.body

				// Load current entityLinks
				const entityLinks = await this.persistence.loadEntityLinks()

				// Update the specific entity
				if (!entityLinks[entityId]) {
					entityLinks[entityId] = {}
				}
				Object.assign(entityLinks[entityId], updateData)

				// Save back
				await this.persistence.saveEntityLinks(entityLinks)

				res.json({ success: true })
			} catch (error) {
				console.error('Error updating entityLinks:', error)
				res.json({
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				})
			}
		})

		// Get thumbnail images from the current DCL project
		router.get('/thumbnails', async (req, res) => {
			try {
				console.log('API: /thumbnails endpoint called')
				console.log('API: Getting thumbnails, projectPath:', self.projectPath)
				console.log('API: Project path type:', typeof self.projectPath)
				console.log('API: Project path truthy:', !!self.projectPath)
				const images: Array<{ name: string; url: string; project: string }> = []

				if (!self.projectPath) {
					console.log('API: No project path set - returning empty array')
					return res.json({
						success: true,
						data: images,
						message: 'No project loaded. Please select a project first.',
					})
				}

				console.log('API: Project path is set, proceeding with image scan')

				// Capture projectPath in a local variable to avoid 'this' binding issues
				const currentProjectPath = self.projectPath
				console.log('API: Captured project path:', currentProjectPath)

				// Helper function to recursively get all image files from a directory
				const getAllImageFiles = async (
					dirPath: string,
					baseUrl: string,
					projectName: string
				): Promise<Array<{ name: string; url: string; project: string }>> => {
					const result: Array<{ name: string; url: string; project: string }> =
						[]

					try {
						console.log(`API: Attempting to read directory: ${dirPath}`)
						const items = await fs.readdir(dirPath)
						console.log(
							`API: Successfully read directory, found ${items.length} items:`,
							items
						)

						for (const item of items) {
							console.log(`API: Processing item: ${item}`)
							const fullPath = path.join(dirPath, item)
							const stat = await fs.stat(fullPath)

							if (stat.isDirectory()) {
								console.log(`API: ${item} is a directory, recursing...`)
								// Recursively scan subdirectories
								const subImages = await getAllImageFiles(
									fullPath,
									baseUrl,
									projectName
								)
								result.push(...subImages)
							} else if (stat.isFile()) {
								console.log(`API: ${item} is a file`)
								// Check if it's an image file
								const ext = path.extname(item).toLowerCase()
								console.log(`API: Extension: ${ext}`)
								if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
									const relativePath = path.relative(dirPath, fullPath)
									const url = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`
									console.log(`API: Found image: ${relativePath} -> ${url}`)
									result.push({
										name: relativePath,
										url: url,
										project: projectName,
									})
								} else {
									console.log(`API: Skipping non-image file: ${item}`)
								}
							}
						}
					} catch (error) {
						// Gracefully ignore if directory doesn't exist or can't be read
						console.log(
							`API: Could not read directory ${dirPath}:`,
							error instanceof Error ? error.message : String(error)
						)
						console.log('API: Full error object:', error)
					}

					return result
				}

				// Look for images in multiple locations
				console.log('API: Checking for images in multiple locations...')

				// 1. Check thumbnails folder (existing logic)
				const thumbnailsPath = path.join(currentProjectPath, 'thumbnails')
				try {
					console.log('API: Checking thumbnails folder:', thumbnailsPath)
					const thumbnailImages = await getAllImageFiles(
						thumbnailsPath,
						`http://localhost:31234/api/thumbnails/${path.basename(
							currentProjectPath
						)}`,
						path.basename(currentProjectPath)
					)
					console.log(
						`API: Found ${thumbnailImages.length} images in thumbnails`
					)
					images.push(...thumbnailImages)
				} catch (error) {
					console.log('API: No thumbnails folder accessible')
				}

				// 2. Check assets/images folder (new requirement)
				const assetsImagesPath = path.join(
					currentProjectPath,
					'assets',
					'images'
				)
				console.log(
					'API: About to check assets/images folder:',
					assetsImagesPath
				)
				console.log(
					'API: Does assets/images path exist?',
					require('fs').existsSync(assetsImagesPath) ? 'YES' : 'NO'
				)
				try {
					console.log('API: Checking assets/images folder:', assetsImagesPath)
					const assetsImages = await getAllImageFiles(
						assetsImagesPath,
						`http://localhost:31234/assets/images`,
						'assets'
					)
					console.log(
						`API: Found ${assetsImages.length} images in assets/images`
					)
					images.push(...assetsImages)
				} catch (error) {
					console.log(
						'API: No assets/images folder accessible:',
						error instanceof Error ? error.message : String(error)
					)
					console.log('API: Full error details:', error)
				}

				console.log(`API: Total images found: ${images.length}`)

				const response = {
					success: true,
					data: images,
				}
				res.json(response)
			} catch (error) {
				console.error('Error getting thumbnails:', error)
				const response = {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				}
				res.status(500).json(response)
			}
		})

		this.app.use('/api', router)

		// Serve thumbnail images from the current DCL project
		this.app.get('/api/thumbnails/:project/:filename', async (req, res) => {
			try {
				const { project, filename } = req.params

				if (!this.projectPath) {
					return res.status(404).json({ error: 'No project loaded' })
				}

				// Verify the project matches the current project
				if (project !== path.basename(this.projectPath)) {
					return res.status(403).json({ error: 'Access denied' })
				}

				// Try both locations: root thumbnails folder and scene/thumbnails folder
				let filePath = path.join(this.projectPath, 'thumbnails', filename)
				let foundFilePath = null

				// First check root thumbnails folder
				try {
					await fs.access(filePath)
					foundFilePath = filePath
				} catch {
					// If not found at root, check scene/thumbnails
					filePath = path.join(
						this.projectPath,
						'scene',
						'thumbnails',
						filename
					)
					try {
						await fs.access(filePath)
						foundFilePath = filePath
					} catch {
						// File not found in either location
					}
				}

				if (!foundFilePath) {
					return res.status(404).json({ error: 'File not found' })
				}

				filePath = foundFilePath

				// Security check: ensure the file is within a thumbnails directory
				const rootThumbnailsDir = path.join(this.projectPath, 'thumbnails')
				const sceneThumbnailsDir = path.join(
					this.projectPath,
					'scene',
					'thumbnails'
				)
				if (
					!filePath.startsWith(rootThumbnailsDir) &&
					!filePath.startsWith(sceneThumbnailsDir)
				) {
					return res.status(403).json({ error: 'Access denied' })
				}

				// File exists (already verified above)

				// Set appropriate content type based on file extension
				const ext = path.extname(filename).toLowerCase()
				const contentTypes: { [key: string]: string } = {
					'.png': 'image/png',
					'.jpg': 'image/jpeg',
					'.jpeg': 'image/jpeg',
					'.gif': 'image/gif',
					'.webp': 'image/webp',
				}

				const contentType = contentTypes[ext] || 'application/octet-stream'
				res.setHeader('Content-Type', contentType)
				res.setHeader('Access-Control-Allow-Origin', '*')
				res.setHeader('Access-Control-Allow-Methods', 'GET')
				res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
				res.setHeader('Cache-Control', 'no-cache')

				// Stream the file
				const fileStream = require('fs').createReadStream(filePath)
				fileStream.pipe(res)
			} catch (error) {
				console.error('Error serving thumbnail:', error)
				res.status(500).json({ error: 'Internal server error' })
			}
		})
	}

	/**
	 * Update the persistence manager's data directory
	 */
	private async updateDataDirectory(projectPath: string): Promise<void> {
		const dataDir = path.join(projectPath, 'src/questEngine/data')

		// Create new persistence instance with the project-specific data directory
		this.persistence = new ElectronPersistenceManager(dataDir)
	}

	/**
	 * Initialize default data for a new project
	 */
	private async initializeDefaultData(dataDir: string): Promise<void> {
		// Use process.cwd() to get the main project directory, then navigate to src/questEditor/data
		const defaultDataDir = path.join(process.cwd(), 'src/questEditor/data')
		console.log('__dirname:', __dirname)
		console.log('process.cwd():', process.cwd())
		console.log('defaultDataDir:', defaultDataDir)
		console.log('target dataDir:', dataDir)

		// Check if any data files exist
		try {
			const files = await fs.readdir(dataDir)
			if (files.length > 0) {
				// Data already exists, don't overwrite
				console.log('Data already exists in project, skipping initialization')
				return
			}
		} catch (error) {
			console.log('Data directory does not exist, will create:', error)
		}

		// Ensure target directory exists
		await fs.mkdir(dataDir, { recursive: true })
		console.log('Created data directory:', dataDir)

		// Copy default data files
		const dataFiles = [
			'quests.json',
			'locations.json',
			'npcs.json',
			'portals.json',
			'dialogues.json',
			'entityLinks.json',
			'items.json',
		]

		for (const file of dataFiles) {
			try {
				const sourcePath = path.join(defaultDataDir, file)
				const targetPath = path.join(dataDir, file)

				console.log(
					`Attempting to copy ${file} from ${sourcePath} to ${targetPath}`
				)

				// Check if source file exists and copy it
				try {
					await fs.access(sourcePath)
					await fs.copyFile(sourcePath, targetPath)
					console.log(`✅ Successfully copied ${file} to project`)
				} catch (copyError) {
					// If source file doesn't exist, create an empty JSON file
					console.warn(
						`Source file ${file} not found, creating empty JSON file`
					)
					const emptyData = this.getEmptyDataForFile(file)
					await fs.writeFile(targetPath, JSON.stringify(emptyData, null, 2))
					console.log(`✅ Created empty ${file} in project`)
				}
			} catch (error) {
				console.error(`❌ Failed to create ${file}:`, error)
			}
		}

		console.log('Data initialization complete')
	}

	/**
	 * Get empty data structure for a specific file type
	 */
	private getEmptyDataForFile(filename: string): any {
		switch (filename) {
			case 'quests.json':
				return []
			case 'npcs.json':
				return []
			case 'items.json':
				return []
			case 'locations.json':
				return []
			case 'portals.json':
				return []
			case 'dialogues.json':
				return []
			case 'entityLinks.json':
				return {}
			default:
				return {}
		}
	}

	/**
	 * Setup DCL scene monitoring for the project
	 */
	private setupSceneMonitoring(projectPath: string): void {
		// Clear existing monitoring
		if (this.sceneMonitoringInterval) {
			clearInterval(this.sceneMonitoringInterval)
		}

		const compositePath = path.join(projectPath, 'assets/scene/main.composite')
		const linksPath = path.join(
			projectPath,
			'src/questEngine/data/entityLinks.json'
		)

		let lastHash: string | null = null

		let heartbeatCount = 0

		const monitorChanges = async () => {
			try {
				// Check if composite file exists
				await fs.access(compositePath)

				const compositeData = JSON.parse(
					await fs.readFile(compositePath, 'utf8')
				)
				const currentHash = this.computeHash(compositeData)

				if (currentHash !== lastHash) {
					lastHash = currentHash
					const newLinks = this.extractEntityData(compositeData)
					await this.updateEntityLinks(newLinks, linksPath)
					console.log('DCL scene entities updated in project:', projectPath)
				}

				// Show heartbeat every 10 checks (30 seconds)
				heartbeatCount++
				if (heartbeatCount % 10 === 0) {
					console.log('DCL monitoring active for project:', projectPath)
				}
			} catch (error) {
				// File might not exist or be invalid JSON - silently ignore
				if (heartbeatCount % 10 === 0) {
					console.log(
						'DCL monitoring waiting for main.composite file in project:',
						projectPath
					)
				}
				heartbeatCount++
			}
		}

		// Run initial check
		monitorChanges()

		// Monitor every 3 seconds
		this.sceneMonitoringInterval = setInterval(monitorChanges, 3000)
		console.log('DCL scene monitoring started for project:', projectPath)
		console.log('Monitoring file:', compositePath)
		console.log('Will update:', linksPath)
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
			const data = await fs.readFile(linksPath, 'utf8')
			existingLinks = JSON.parse(data)
		} catch {
			// File doesn't exist, use empty object
		}

		const updatedLinks: Record<string, any> = {}

		// Process existing entities
		for (const entityId in existingLinks) {
			const existingEntity = existingLinks[entityId]

			if (newLinks[entityId]) {
				// Entity still exists, update with new data (including name changes)
				updatedLinks[entityId] = {
					...newLinks[entityId],
					questEntityId: existingEntity.questEntityId, // Preserve existing quest entity links
				}
			} else {
				// Entity was removed from main.composite - delete it entirely
				console.log(
					`Removing entity ${entityId} (${existingEntity.name}) from entityLinks.json`
				)
			}
		}

		// Add any new entities from main.composite
		for (const entityId in newLinks) {
			if (!existingLinks[entityId]) {
				updatedLinks[entityId] = newLinks[entityId]
				console.log(
					`Adding new entity ${entityId} (${newLinks[entityId].name}) to entityLinks.json`
				)
			}
		}

		// Ensure directory exists
		await fs.mkdir(path.dirname(linksPath), { recursive: true })

		// Write back to file
		await fs.writeFile(linksPath, JSON.stringify(updatedLinks, null, 2))
		console.log('entityLinks.json updated.')

		// Compile data after entity links update
		await this.persistence.compileDataToTypescript()
	}

	/**
	 * Start the questEditor backend server on a fixed uncommon port
	 */
	async start(): Promise<number> {
		const port = 31234 // Uncommon port that's unlikely to conflict with user projects

		return new Promise((resolve, reject) => {
			this.server = this.app.listen(port, () => {
				console.log(`QuestEditor backend running on port ${port}`)
				resolve(port)
			})

			this.server.on('error', (err: any) => {
				reject(
					new Error(`Failed to start server on port ${port}: ${err.message}`)
				)
			})
		})
	}

	/**
	 * Stop the questEditor backend server
	 */
	stop(): void {
		if (this.server) {
			this.server.close()
			this.server = null
		}
		if (this.sceneMonitoringInterval) {
			clearInterval(this.sceneMonitoringInterval)
			this.sceneMonitoringInterval = null
		}
	}

	/**
	 * Get the Express app instance for additional configuration
	 */
	getApp(): express.Application {
		return this.app
	}

	/**
	 * Get API methods that can be exposed via IPC
	 */
	getApiMethods() {
		return {
			// These methods can be called via IPC to interact with the questEditor backend
			getGameData: async () =>
				this.engine ? await this.engine.getGame() : null,
			saveGameData: async (data: any) =>
				this.engine ? await this.engine.saveGame(data) : null,
			getQuests: () => this.persistence.loadQuests(),
			saveQuests: (quests: any[]) => this.persistence.saveQuests(quests),
			persistence: this.persistence,
			// Add more methods as needed
		}
	}
}
