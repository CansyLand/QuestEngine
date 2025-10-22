import express from 'express'
import cors from 'cors'
import * as path from 'path'
import { BrowserWindow } from 'electron'
import { PersistenceManager } from '../core/persistence'
import { GameEngine } from '../core/engine'
import { createApiRouter } from '../core/api'
import { setupThumbnailRoutes } from './api/thumbnails-handler'
import { setupStaticRoutes } from './server/static-server'
import { SceneMonitor } from './monitoring/scene-monitor'
import { initializeDefaultData } from './utils/data-utils'

export class QuestEditorIntegration {
	private app: express.Application
	private server: any
	private engine: GameEngine | null = null
	private persistence: PersistenceManager
	private projectPath: string | null = null
	private sceneMonitor: SceneMonitor

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
	async setProjectPath(projectPath: string): Promise<void> {
		console.log('QuestEditorIntegration: Setting project path to:', projectPath)
		this.projectPath = projectPath
		await this.updateDataDirectory(projectPath)
		await this.initializeEngine()
		this.sceneMonitor.setupSceneMonitoring(projectPath, this.persistence)
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
		// Initialize the real game engine
		this.engine = new GameEngine(this.persistence)
		await this.engine.initializeGame()

		// Setup comprehensive API routes
		const router = createApiRouter(
			this.engine,
			this.persistence,
			this.projectPath
		)
		this.app.use('/api', router)

		// Setup thumbnail routes
		setupThumbnailRoutes(this.app, this.projectPath)
	}

	/**
	 * Update the persistence manager's data directory
	 */
	private async updateDataDirectory(projectPath: string): Promise<void> {
		const dataDir = path.join(projectPath, 'src/questEngine/data')

		// Create new persistence instance with the project-specific data directory
		this.persistence = new PersistenceManager(dataDir)

		// Initialize default data if needed
		await initializeDefaultData(dataDir)
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
