import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import * as path from 'path'
import { autoUpdater } from 'electron-updater'
import * as fs from 'fs/promises' // For file I/O
import { QuestEngineService } from './src/infrastructure/integration/QuestEngineService'

let mainWindow: BrowserWindow | null = null
let questEngine: QuestEngineService | null = null

// Project data structure
interface Project {
	id: string
	name: string
	path: string
	createdAt: string
	lastOpenedAt?: string
}

// Simple file-based storage for projects
const getProjectsFilePath = (): string => {
	return path.join(app.getPath('userData'), 'projects.json')
}

const loadProjects = async (): Promise<Project[]> => {
	try {
		const filePath = getProjectsFilePath()
		const data = await fs.readFile(filePath, 'utf8')
		return JSON.parse(data)
	} catch {
		return []
	}
}

const saveProjects = async (projects: Project[]): Promise<void> => {
	const filePath = getProjectsFilePath()
	await fs.writeFile(filePath, JSON.stringify(projects, null, 2), 'utf8')
}

function createWindow(): void {
	mainWindow = new BrowserWindow({
		width: 1800,
		height: 1000,
		minWidth: 500,
		minHeight: 500,
		webPreferences: {
			nodeIntegration: false, // Security: Disable direct Node in renderer
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js'), // Compiled from preload.ts
		},
	})

	// Disable HMR for Electron renderer to prevent hot-update.js requests
	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow?.webContents.executeJavaScript(`
			if (typeof window !== 'undefined' && window.__webpack_require__) {
				// Disable webpack HMR
				if (window.__webpack_require__.hot) {
					window.__webpack_require__.hot.decline();
				}
			}
			// Disable any other HMR mechanisms
			if (typeof window !== 'undefined' && window.hot) {
				window.hot.decline();
			}
		`)
	})

	const isDev = process.env.NODE_ENV === 'development'
	const htmlPath = isDev
		? 'http://localhost:3000'
		: `file://${path.join(__dirname, 'index.html')}`

	console.log('Loading URL:', htmlPath)
	console.log('__dirname:', __dirname)

	mainWindow.loadURL(htmlPath).catch((err) => {
		console.error('Failed to load URL:', htmlPath, err)
	})

	// Always open dev tools for debugging
	mainWindow.webContents.openDevTools({ mode: 'detach' })

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

// Auto-update setup
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

app.whenReady().then(async () => {
	createWindow()

	// Initialize QuestEngine service
	questEngine = new QuestEngineService()
	console.log('QuestEngine service initialized')

	autoUpdater.checkForUpdatesAndNotify()
})

autoUpdater.on('update-available', () => {
	dialog.showMessageBox({
		type: 'info',
		title: 'Update Available',
		message: 'A new version is available. Downloading now...',
	})
})

autoUpdater.on('update-downloaded', () => {
	dialog
		.showMessageBox({
			type: 'info',
			title: 'Update Ready',
			message: 'Update downloaded. Restart to apply?',
			buttons: ['Restart', 'Later'],
		})
		.then(({ response }) => {
			if (response === 0) {
				autoUpdater.quitAndInstall()
			}
		})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		// Clean up questEngine before quitting
		questEngine = null
		app.quit()
	}
})

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow()
	}
})

// IPC handlers for secure file operations
ipcMain.handle('select-folder', async (): Promise<string | undefined> => {
	const result = await dialog.showOpenDialog(mainWindow!, {
		properties: ['openDirectory'],
		title: 'Select Folder for Read/Write',
	})
	return result.canceled ? undefined : result.filePaths[0]
})

ipcMain.handle(
	'read-file',
	async (
		_event,
		{ folderPath, fileName }: { folderPath: string; fileName: string }
	): Promise<string> => {
		const fullPath = path.join(folderPath, fileName)
		return fs.readFile(fullPath, 'utf8')
	}
)

ipcMain.handle(
	'write-file',
	async (
		_event,
		{
			folderPath,
			fileName,
			content,
		}: { folderPath: string; fileName: string; content: string }
	): Promise<void> => {
		const fullPath = path.join(folderPath, fileName)
		await fs.writeFile(fullPath, content, 'utf8')
	}
)

// Project management IPC handlers
ipcMain.handle('get-projects', async (): Promise<Project[]> => {
	return await loadProjects()
})

ipcMain.handle(
	'create-project',
	async (
		_event,
		{ name, path: projectPath }: { name: string; path: string }
	): Promise<Project> => {
		const projects = await loadProjects()
		const newProject: Project = {
			id: Date.now().toString(),
			name,
			path: projectPath,
			createdAt: new Date().toISOString(),
		}
		projects.push(newProject)
		await saveProjects(projects)

		// Create questEngine folder and copy game engine files to the project's src directory
		try {
			const projectSrcPath = path.join(projectPath, 'src')
			const tempTemplatePath = path.join(
				projectSrcPath,
				'dclQuestEngineTemplate'
			)
			const finalQuestEnginePath = path.join(projectSrcPath, 'questEngine')
			// Handle different paths for development vs packaged app
			let sourceQuestEnginePath: string
			if (app.isPackaged) {
				// In packaged app, template files are in app.asar.unpacked
				sourceQuestEnginePath = path.join(
					process.resourcesPath,
					'app.asar.unpacked',
					'dclQuestEngineTemplate'
				)
			} else {
				// In development, template files are in the source directory
				sourceQuestEnginePath = path.join(
					app.getAppPath(),
					'dclQuestEngineTemplate'
				)
			}

			console.log('=== PROJECT CREATION DEBUG ===')
			console.log('Project path:', projectPath)
			console.log('Project src path:', projectSrcPath)
			console.log('Source questEngine path:', sourceQuestEnginePath)
			console.log('Temp template path:', tempTemplatePath)
			console.log('Final questEngine path:', finalQuestEnginePath)
			console.log('__dirname:', __dirname)
			console.log('App path:', app.getAppPath())

			// Check if source template folder exists
			try {
				await fs.access(sourceQuestEnginePath)
				console.log(
					'✓ Source dclQuestEngineTemplate folder exists at:',
					sourceQuestEnginePath
				)

				// Copy the entire template folder to project src directory
				await fs.cp(sourceQuestEnginePath, tempTemplatePath, {
					recursive: true,
					force: true,
				})
				console.log('✓ Copied template folder to:', tempTemplatePath)

				// Rename the template folder to questEngine
				await fs.rename(tempTemplatePath, finalQuestEnginePath)
				console.log(
					'✓ Renamed to final questEngine path:',
					finalQuestEnginePath
				)

				// Verify copy by checking if a key file exists
				const testFile = path.join(finalQuestEnginePath, 'index.ts')
				await fs.access(testFile)
				console.log('✓ Verified copy - index.ts exists in target')
			} catch (copyError) {
				console.error('✗ Failed to copy questEngine folder:', copyError)
				console.error('Error details:', (copyError as Error).message)
				throw copyError
			}
		} catch (error) {
			console.error('✗ Failed to create questEngine folder and files:', error)
		}

		return newProject
	}
)

ipcMain.handle(
	'update-project-last-opened',
	async (_event, projectId: string): Promise<void> => {
		const projects = await loadProjects()
		const projectIndex = projects.findIndex((p) => p.id === projectId)
		if (projectIndex !== -1) {
			projects[projectIndex].lastOpenedAt = new Date().toISOString()
			await saveProjects(projects)
		}
	}
)

ipcMain.handle(
	'delete-project',
	async (_event, projectId: string): Promise<void> => {
		const projects = await loadProjects()
		const filteredProjects = projects.filter((p) => p.id !== projectId)
		await saveProjects(filteredProjects)
	}
)

// QuestEngine IPC handlers
ipcMain.handle(
	'set-quest-editor-project',
	async (_event, projectPath: string): Promise<void> => {
		if (questEngine) {
			await questEngine.setProjectPath(projectPath)
		}
	}
)

ipcMain.handle(
	'get-quest-editor-project-path',
	async (): Promise<string | null> => {
		if (questEngine) {
			return questEngine.getProjectPath()
		}
		return null
	}
)

ipcMain.handle(
	'get-quest-data',
	async (_event, dataType: string): Promise<any> => {
		if (!questEngine) return null
		return await questEngine.getQuestData(dataType)
	}
)

ipcMain.handle(
	'save-quest-data',
	async (_event, dataType: string, data: any): Promise<void> => {
		if (!questEngine) return
		return await questEngine.saveQuestData(dataType, data)
	}
)

// Additional API handlers
ipcMain.handle('load-game-data', async (): Promise<any> => {
	if (!questEngine) return { success: false, error: 'Engine not initialized' }
	return await questEngine.loadGameData()
})

ipcMain.handle('save-game-data', async (_event, data: any): Promise<any> => {
	if (!questEngine) return { success: false, error: 'Engine not initialized' }
	return await questEngine.saveGameData(data)
})

ipcMain.handle(
	'generate-id',
	async (
		_event,
		{
			name,
			entityType,
			currentEntityId,
			prefix,
		}: {
			name: string
			entityType: string
			currentEntityId?: string
			prefix?: string
		}
	): Promise<any> => {
		if (!questEngine) return { success: false, error: 'Engine not initialized' }

		// Get existing IDs based on entity type
		let existingIds: string[] = []
		if (questEngine.getQuestData) {
			const data = await questEngine.getQuestData(entityType + 's') // quests, npcs, items, etc.
			if (Array.isArray(data)) {
				existingIds = data.map((item: any) => item.id)
			}
		}

		// Remove current entity ID if editing
		if (currentEntityId) {
			existingIds = existingIds.filter((id: string) => id !== currentEntityId)
		}

		const newId = questEngine.generateId(name, entityType, existingIds, prefix)
		return { success: true, data: { id: newId } }
	}
)

ipcMain.handle('get-thumbnails', async (): Promise<any> => {
	if (!questEngine) return { success: false, error: 'Engine not initialized' }
	return await questEngine.getThumbnails()
})

ipcMain.handle(
	'read-thumbnail',
	async (_event, filePath: string): Promise<string | null> => {
		if (!questEngine) return null
		return await questEngine.readThumbnail(filePath)
	}
)

ipcMain.handle(
	'read-audio',
	async (_event, filePath: string): Promise<string | null> => {
		if (!questEngine) return null
		return await questEngine.readAudio(filePath)
	}
)

ipcMain.handle('start-game', async (): Promise<any> => {
	if (!questEngine) return { success: false, error: 'Engine not initialized' }
	return questEngine.startGame()
})

ipcMain.handle(
	'process-interaction',
	async (
		_event,
		{ type, params }: { type: string; params: any }
	): Promise<any> => {
		if (!questEngine) return { success: false, error: 'Engine not initialized' }
		return questEngine.processInteraction(type, params)
	}
)

ipcMain.handle('reset-game', async (): Promise<any> => {
	if (!questEngine) return { success: false, error: 'Engine not initialized' }
	return questEngine.resetGame()
})

ipcMain.handle(
	'get-dialogue',
	async (_event, dialogueSequenceId: string): Promise<any> => {
		if (!questEngine) return { success: false, error: 'Engine not initialized' }
		return questEngine.getDialogue(dialogueSequenceId)
	}
)

ipcMain.handle('compile-data', async (): Promise<any> => {
	if (!questEngine) return { success: false, error: 'Engine not initialized' }
	return await questEngine.compileData()
})

ipcMain.handle('get-entity-links', async (): Promise<any> => {
	if (!questEngine) return { success: false, error: 'Engine not initialized' }
	return await questEngine.getEntityLinks()
})

ipcMain.handle(
	'update-entity-link',
	async (
		_event,
		{ entityId, questEntityId }: { entityId: string; questEntityId: string }
	): Promise<any> => {
		if (!questEngine) return { success: false, error: 'Engine not initialized' }
		return await questEngine.updateEntityLink(entityId, questEntityId)
	}
)

// Open player window
ipcMain.handle('open-player-window', async (): Promise<void> => {
	const playerWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js'),
		},
		title: 'QuestEngine Player',
		show: false, // Don't show until ready
	})

	const isDev = process.env.NODE_ENV === 'development'
	const htmlPath = isDev
		? 'http://localhost:3000/player/'
		: `file://${path.join(__dirname, 'index.html')}#/player/`

	playerWindow.loadURL(htmlPath)

	playerWindow.once('ready-to-show', () => {
		playerWindow.show()
		playerWindow.focus()
	})

	playerWindow.on('closed', () => {
		// Cleanup if needed
	})
})
