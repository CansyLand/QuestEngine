import express from 'express'
import cors from 'cors'
import * as path from 'path'
import { BrowserWindow } from 'electron'
import { PersistenceManager } from '../../core/services/persistence/PersistenceManager'
import { GameEngine } from '../../core/engine/GameEngine'
import { createApiRouter } from '../../core/services/api/ApiService'
import { setupThumbnailRoutes } from '../api/thumbnails/handler'
import { setupStaticRoutes } from '../server/StaticServer'
import { SceneMonitor } from '../monitoring/SceneMonitor'

export class QuestEditorIntegration {
	private app: express.Application
	private server: any
	private engine: GameEngine | null = null
	private persistence: PersistenceManager
	private projectPath: string | null = null
	private sceneMonitor: SceneMonitor
	private manualProjectSwitch: boolean = false

	constructor() {
		this.app = express()
		this.app.use(cors())
		this.app.use(express.json())

		// Initialize backend components
		this.persistence = new PersistenceManager('')
		this.sceneMonitor = new SceneMonitor()

		// Engine will be initialized when project path is set
		// API routes will be mounted after engine initialization

		// Setup static file serving for project assets
		setupStaticRoutes(this.app, null)
	}

	/**
	 * Set the active project path and update data directory
	 */
	async setProjectPath(
		projectPath: string,
		isManualSwitch: boolean = false
	): Promise<void> {
		console.log(
			'QuestEditorIntegration: Setting project path to:',
			projectPath,
			isManualSwitch ? '(manual switch)' : '(automatic)'
		)
		this.manualProjectSwitch = isManualSwitch
		this.projectPath = projectPath
		await this.updateDataDirectory(projectPath)
		await this.initializeEngine()

		// Only setup scene monitoring for automatic switches, not manual ones
		if (!isManualSwitch) {
			this.sceneMonitor.setupSceneMonitoring(projectPath, this.persistence)
		} else {
			// Stop any existing monitoring for manual switches
			this.sceneMonitor.stopSceneMonitoring()
		}

		setupStaticRoutes(this.app, projectPath) // Update static routes for new project
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
		try {
			// Initialize the real game engine
			this.engine = new GameEngine(this.persistence)
			await this.engine.initializeGame()

			// Remove old API routes if they exist
			// Express doesn't have a built-in way to remove routes, so we need to be careful
			// The routes will be replaced when we call use() again with the same path

			// Setup comprehensive API routes
			const router = createApiRouter(
				this.engine,
				this.persistence,
				this.projectPath
			)

			// Safely remove existing routes if router exists
			if (this.app._router && this.app._router.stack) {
				// Remove existing /api route stack and replace with new one
				this.app._router.stack = this.app._router.stack.filter((layer: any) => {
					return !layer.route || layer.route.path !== '/api'
				})

				// Remove old thumbnail routes
				this.app._router.stack = this.app._router.stack.filter((layer: any) => {
					return (
						!layer.route ||
						!layer.route.path ||
						!layer.route.path.startsWith('/api/thumbnails')
					)
				})
			}

			this.app.use('/api', router)
			setupThumbnailRoutes(this.app, this.projectPath)

			console.log(
				'QuestEditorIntegration: Engine initialized with new data directory'
			)
		} catch (error) {
			console.error(
				'QuestEditorIntegration: Failed to initialize engine:',
				error
			)
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
		this.sceneMonitor.stopSceneMonitoring()
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
			getGameData: () => (this.engine ? this.engine.getGameState() : null),
			saveGameData: async (data: any) =>
				this.engine ? await this.engine.saveGame() : null,
			processInteraction: (type: string, params: any) =>
				this.engine ? this.engine.processInteraction(type, params) : [],
			getQuests: async () => await this.persistence.loadQuests(),
			saveQuests: async (quests: any[]) =>
				await this.persistence.saveQuests(quests),
			persistence: this.persistence,
			engine: this.engine,
			// Add more methods as needed
		}
	}
}
