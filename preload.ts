import { contextBridge, ipcRenderer } from 'electron'

interface Project {
	id: string
	name: string
	path: string
	createdAt: string
	lastOpenedAt?: string
}

contextBridge.exposeInMainWorld('electronAPI', {
	selectFolder: (): Promise<string | undefined> =>
		ipcRenderer.invoke('select-folder'),
	readFile: (folderPath: string, fileName: string): Promise<string> =>
		ipcRenderer.invoke('read-file', { folderPath, fileName }),
	writeFile: (
		folderPath: string,
		fileName: string,
		content: string
	): Promise<void> =>
		ipcRenderer.invoke('write-file', { folderPath, fileName, content }),
	getProjects: (): Promise<Project[]> => ipcRenderer.invoke('get-projects'),
	createProject: (name: string, path: string): Promise<Project> =>
		ipcRenderer.invoke('create-project', { name, path }),
	updateProjectLastOpened: (projectId: string): Promise<void> =>
		ipcRenderer.invoke('update-project-last-opened', projectId),
	deleteProject: (projectId: string): Promise<void> =>
		ipcRenderer.invoke('delete-project', projectId),
	// QuestEngine API methods
	setQuestEditorProject: (projectPath: string): Promise<void> =>
		ipcRenderer.invoke('set-quest-editor-project', projectPath),
	getQuestEditorProjectPath: (): Promise<string | null> =>
		ipcRenderer.invoke('get-quest-editor-project-path'),
	getQuestData: (dataType: string): Promise<any> =>
		ipcRenderer.invoke('get-quest-data', dataType),
	saveQuestData: (dataType: string, data: any): Promise<void> =>
		ipcRenderer.invoke('save-quest-data', dataType, data),
	// Game data operations
	loadGameData: (): Promise<any> => ipcRenderer.invoke('load-game-data'),
	saveGameData: (data: any): Promise<any> =>
		ipcRenderer.invoke('save-game-data', data),
	// ID generation
	generateId: (
		name: string,
		entityType: string,
		currentEntityId?: string,
		prefix?: string
	): Promise<any> =>
		ipcRenderer.invoke('generate-id', {
			name,
			entityType,
			currentEntityId,
			prefix,
		}),
	// Thumbnail operations
	getThumbnails: (): Promise<any> => ipcRenderer.invoke('get-thumbnails'),
	readThumbnail: (filePath: string): Promise<string | null> =>
		ipcRenderer.invoke('read-thumbnail', filePath),
	// Game operations
	startGame: (): Promise<any> => ipcRenderer.invoke('start-game'),
	processInteraction: (type: string, params: any): Promise<any> =>
		ipcRenderer.invoke('process-interaction', { type, params }),
	resetGame: (): Promise<any> => ipcRenderer.invoke('reset-game'),
	getDialogue: (dialogueSequenceId: string): Promise<any> =>
		ipcRenderer.invoke('get-dialogue', dialogueSequenceId),
	// Utility operations
	compileData: (): Promise<any> => ipcRenderer.invoke('compile-data'),
	getEntityLinks: (): Promise<any> => ipcRenderer.invoke('get-entity-links'),
	updateEntityLink: (entityId: string, questEntityId: string): Promise<any> =>
		ipcRenderer.invoke('update-entity-link', { entityId, questEntityId }),
})
