import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import * as path from 'path'
import { autoUpdater } from 'electron-updater'
import * as fs from 'fs/promises' // For file I/O

let mainWindow: BrowserWindow | null = null

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
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: false, // Security: Disable direct Node in renderer
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js'), // Compiled from preload.ts
		},
	})

	const isDev = process.env.NODE_ENV === 'development'
	mainWindow.loadURL(
		isDev
			? 'http://localhost:3000'
			: `file://${path.join(__dirname, 'build/index.html')}`
	)

	if (isDev) {
		mainWindow.webContents.openDevTools({ mode: 'detach' })
	}

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

// Auto-update setup
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

app.whenReady().then(() => {
	createWindow()
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
